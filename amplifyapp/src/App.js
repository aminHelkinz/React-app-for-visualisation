import "@aws-amplify/ui-react/styles.css";
import { withAuthenticator, Button, Heading, Image, View, Card } from "@aws-amplify/ui-react";
import { useEffect, useRef, useState } from "react";
import { Amplify, Storage } from "aws-amplify";
import { Auth } from "@aws-amplify/auth";

function App({ signOut }) {
  const ref = useRef(null);
  const [files, setFiles] = useState([]);
  const [image, setImage] = useState(null);
  const [progress, setProgress] = useState();
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    Amplify.configure({
      Auth: {
        identityPoolId: 'eu-west-3:5c0822cb-cf4a-4b2f-a235-3ddeefb0b41f', //REQUIRED - Amazon Cognito Identity Pool ID
        region: 'eu-west-3', // REQUIRED - Amazon Cognito Region
      },
      Storage: {
        AWSS3: {
          bucket: "amplifyapp6ba67f24072e4fc196fb52a34c0391ec135725-dev",
          region: "eu-west-3",
        },
      },
    });
  }, []);

  const loadFiles = () => {
    Storage.list("")
      .then((files) => {
        console.log(files);
        setFiles(files);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  useEffect(() => {
    loadFiles();
  }, []);

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
      const lastAtSymbolIndex = userEmail.lastIndexOf("@");
      const truncatedEmail = userEmail.substring(0, lastAtSymbolIndex);
  
      const authenticatedUser = user.username.toLowerCase();
      const fileName = `${authenticatedUser}_${truncatedEmail}_${timestamp}.csv`;
  
      setSelectedFile(file);
  
      Storage.put(fileName, file, {
        progressCallback: (progress) => {
          setProgress(Math.round((progress.loaded / progress.total) * 100) + "%");
          setTimeout(() => { setProgress() }, 1000);
        },
        level: 'public'
      })
      
        .then(resp => {
          console.log(resp);
          loadFiles();
          setSelectedFile(null);
        }).catch(err => { console.log(err); setSelectedFile(null); });
    } catch (error) {
      console.log("Error getting authenticated user:", error);
    }
  }
  

  const handleShow = (file) => {
    Storage.get(file).then(resp => {
      console.log(resp);
      setImage(resp)
    }).catch(err => { console.log(err); });
  }

  const handleDelete = (file) => {
    Storage.remove(file).then(resp => {
      console.log(resp);
      loadFiles();
    }).catch(err => { console.log(err); });
  }

  return (
    <View className="App">
      <Card>
        <Heading level={1} style={{ color: "#00bfff" }}> Welcome Dear customer!</Heading>
      </Card>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <Button onClick={signOut}>Sign Out</Button>
      </div>
      <input ref={ref} type="file" accept=".csv" onChange={handleFileLoad} />
      {progress}
      <table>
        <tbody>
          {Array.isArray(files) &&
            files.map((file, i) => (
              <tr key={file.key}>
                <td>{i}</td>
                <td>{file.key}</td>
                <td>
                  <Button onClick={() => handleShow(file.key)}>Show</Button>
                  <Button onClick={() => handleDelete(file.key)}>Delete</Button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      {image && <Image src={image} alt="File" />}
    </View>
  );
}

export default withAuthenticator(App);
