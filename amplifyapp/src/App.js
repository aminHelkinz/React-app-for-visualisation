import "@aws-amplify/ui-react/styles.css";
import React, { useEffect, useRef, useState } from "react";
import { Amplify, Auth, Storage, API } from "aws-amplify";
import {
  withAuthenticator,
  Button,
  Heading,
  View,
  Card
} from "@aws-amplify/ui-react";


function App({ signOut }) {
  const ref = useRef(null);
  const [fileInputKey, setFileInputKey] = useState("");
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState();
  const [image, setImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showVisualizationLoadingPage, setShowVisualizationLoadingPage] = useState(false);
  const [apiData, setApiData] = useState([]);
  const [root, setRoot] = useState("");
 //************************************** Amplify configuration Part**********************************************//
  useEffect(() => {
    Amplify.configure({
      Auth: {
        identityPoolId: "eu-west-3:5c0822cb-cf4a-4b2f-a235-3ddeefb0b41f",
        region: "eu-west-3",
      },
      Storage: {
        AWSS3: {
          bucket: "amplifyapp6ba67f24072e4fc196fb52a34c0391ec135725-dev",
          region: "eu-west-3",
        },
      },
    });
    callApi("");
    loadFiles();
  }, []);
 //************************************** Upload Files Part**********************************************//
  const loadFiles = () => {
    Storage.list(root)
      .then((files) => {
        console.log(files);
        setFiles(files);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleFileLoad = async () => {
    const file = ref.current.files[0];

    if (selectedFile) {
      console.log("A file is already selected. Please upload one file at a time.");
      return;
    }

    try {
      const user = await Auth.currentAuthenticatedUser();
      const userEmail = user.attributes.email;
      const authenticatedUser = user.username;
      const uniqueKey = `${authenticatedUser}-${Date.now()}`;
      const fileName = `${uniqueKey}#${userEmail}.csv`;

      setSelectedFile(file);

      Storage.put(fileName, file, {
        progressCallback: (progress) => {
          setProgress(Math.round((progress.loaded / progress.total) * 100) + "%");
        },
      })
        .then((resp) => {
          console.log(resp);
          setSelectedFile(null);
          setShowVisualizationLoadingPage(false);
          loadFiles();

          setFileInputKey(Date.now().toString());
        })
        .catch((err) => {
          console.log(err);
          setSelectedFile(null);
        });
    } catch (error) {
      console.log("Error getting authenticated user:", error);
    }
  };

  //************************************** API Get Prefix **********************************************//
  async function callApi(folderName) {
    try {
      const requestData = {
        headers: {
          token: `${(await Auth.currentSession())
            .getIdToken()
            .getJwtToken()}`,
        },
        queryStringParameters: {
          Prefix: folderName,
        },
      };

      const { response } = await API.get("api8bf39c3e", "/items", requestData);

      let data = [];
      if (response.CommonPrefixes.length !== 0) {
        data = response.CommonPrefixes.map((i) => {
          return { name: i.Prefix.split("/").filter((i) => i).pop() };
        });
        setApiData(data);
      } else {
        data = response.Contents.map((i) => {
          return { key: i.Key, name: i.Key.split("/").filter((i) => i && i).pop() };
        });
        data.shift();
        setApiData(data);
      }
    } catch (error) {
      console.log("Error calling API:", error);
    }
  }
//**************************************API Get image **********************************************//
async function getImageFromBackend(objectName) {
  try {
    const requestData = {
      headers: {
        token: `${(await Auth.currentSession())
          .getIdToken()
          .getJwtToken()}`,
      },
      queryStringParameters: {
        Prefix: objectName,
      },
    };

    const response = await API.get("api8bf39c3e", `/items/get/`, requestData);
    console.log("-----", response, "-----");

    const blob = await response.blob();
    console.log(blob);

    if (blob) {
  
      const imageUrl = await blobToDataURL(blob);
      setImage(imageUrl);
    } else {
      setImage(null);
    }
  } catch (error) {
    console.log("Error calling API:", error);
    if (
      error.response &&
      error.response.status === 500 &&
      error.response.data === "NoSuchKey: The specified key does not exist"
    ) {
      setImage(null);
    }
  }
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}


//*************************************** Api function to click in folders *********************************************//
  const handleFolderClick = (folderName) => {
    console.log(folderName);
    const updatedRoot = root !== "" ? `${root}/${folderName}` : folderName;
    console.log(updatedRoot);

    if (folderName.endsWith(".png")) {
      getImageFromBackend(updatedRoot);
    } else {
      setRoot(updatedRoot);
      callApi(updatedRoot);
    }
  };
//************************************** main **********************************************//
  return (
    <View className="App">
      <>
        <Card>
          <Heading level={1}>Welcome, dear customer!</Heading>
        </Card>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
          <Button onClick={() => setShowVisualizationLoadingPage(true)}>Switch to Visualization Loading Page</Button>
          <Button onClick={signOut}>Sign Out</Button>
        </div>
        <input key={fileInputKey} ref={ref} type="file" accept=".csv" onChange={handleFileLoad} />
        {progress}
        
        
        {image && <img src={image} alt="File" />}

      </>
      <table>
        <tbody>
          {Array.isArray(apiData) &&
            apiData.map((folder) => (
              <tr key={folder.name}>
                <td>
                  <a href="#" onClick={() => handleFolderClick(folder.name)}>
                    {folder.name}
                  </a>
                </td>
                <td> 
                </td>
                
              </tr>
            ))}
        </tbody>
      </table>
    </View>
  );
}

export default withAuthenticator(App);
