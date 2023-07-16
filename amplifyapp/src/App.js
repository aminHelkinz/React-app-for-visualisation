import "@aws-amplify/ui-react/styles.css";
import React, { useEffect, useRef, useState } from "react";
import { Amplify, Auth, Storage, API } from "aws-amplify";
import {
  withAuthenticator,
  Button,
  Heading,
  Image,
  View,
  Card,
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
  useEffect(() => {
    Amplify.configure({
      Auth: {
        identityPoolId: "eu-west-3:5c0822cb-cf4a-4b2f-a235-3ddeefb0b41f", // REQUIRED - Amazon Cognito Identity Pool ID
        region: "eu-west-3", // REQUIRED - Amazon Cognito Region
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
    const currentDate = new Date();
    const timestamp = Math.floor(currentDate.getTime() / 1000);
  
    if (selectedFile) {
      console.log("A file is already selected. Please upload one file at a time.");
      return;
    }
  
    try {
      const user = await Auth.currentAuthenticatedUser();
      const userEmail = user.attributes.email;
      const authenticatedUser = user.username;
      const uniqueKey = `${authenticatedUser}-${timestamp}-${file.name.replace(/\s/g, '')}`; // Generate a unique key for the file
      const fileName = `${uniqueKey}#${userEmail}.csv`;
  
      setSelectedFile(file);
  
      Storage.put(fileName, file, {
        progressCallback: (progress) => {
          setProgress(Math.round((progress.loaded / progress.total) * 100) + "%");
          setTimeout(() => {
            setProgress();
          }, 1000);
        },
      })
        .then((resp) => {
          console.log(resp);
          setSelectedFile(null);
          setShowVisualizationLoadingPage(false); // Go back to the main page
          loadFiles(); // Load the files after successful upload
  
          // Clear the file input field
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
            .getJwtToken()}`
        },
        queryStringParameters: {
          Prefix: folderName,
        },
      }; 
      const {response} = await API.get("api8bf39c3e", "/items", requestData);
      
      let data = []
      console.log(response.CommonPrefixes.length)
      if(response.CommonPrefixes.length!=0){
        data = response.CommonPrefixes.map(i => {return {name:i.Prefix.split('/').filter(i=>i).pop()}})
        setApiData(data);

      }else{
        console.log(response)
        data = response.Contents.map(i => {return {key:i.Key,name:i.Key.split('/').filter(i=>i&& i).pop()}})
        data.shift()
        console.log(data)
        setApiData(data);
      }
   
     
     
      
    } catch (error) {
      console.log("Error calling API:", error);
    }
  }
//*************************************** Api Post image *********************************************//
async function getImageFromBackend(folderName) {
  try {
    const token = (await Auth.currentSession()).getIdToken().getJwtToken();

    const requestData = {
      headers: {
        token: token
      },
      body: {
        ObjectName: folderName,
      },
    };

    const response = await API.post("api8bf39c3e", "/items", requestData);
  
    if (response.status === 200) {
      const imageUrl = await Storage.get(folderName);
      setImage(imageUrl);
    } else {
      setImage(null);
    }
  } catch (error) {
    console.log("Error calling API:", error);
    if (error.response && error.response.status === 500 && error.response.data === 'NoSuchKey: The specified key does not exist') {
      setImage(null);
    }
  }
}



  

//*************************************** Api function to click in folders *********************************************//
const handleFolderClick = (folderName) => {
  console.log(folderName);
  const updatedRoot = root !== "" ? `${root}/${folderName}` : folderName;
  console.log(updatedRoot);

  if (folderName.endsWith('.png')) {
    // Handle image object
    const imagePath = `${updatedRoot}/${folderName}`;
    getImageFromBackend(imagePath);
  } else {
    // Handle folder
    setRoot(updatedRoot);
    callApi(updatedRoot);
  }
};

  // const handleFolderClick = (folderName) => {
  //   console.log(folderName)
  //   const updatedRoot = root !== "" ? `${root}/${folderName}` : folderName;
  //   console.log(updatedRoot)
  //   if(folderName.endsWith('.png')){

  //   }else{
  //   setRoot(updatedRoot);
  //   callApi(updatedRoot);
  //   }
  //   // loadFiles();
  // };  

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

          {image && <Image src={image} alt="File" />}
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
                  {folder.image && <Image src={folder.image} alt="Image" />}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

    </View>
  );
}

export default withAuthenticator(App);