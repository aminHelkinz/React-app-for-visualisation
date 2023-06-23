import "@aws-amplify/ui-react/styles.css";
import { withAuthenticator, Button, Heading, Image, View, Card } from "@aws-amplify/ui-react";
import { useEffect, useRef, useState } from "react";
import { Amplify, Storage, Auth } from "aws-amplify";
import VisualizationLoadingPage from "./VisualizationLoadingPage";

function App({ signOut }) {
  const ref = useRef(null);
  const [files, setFiles] = useState([]);
  const [image, setImage] = useState(null);
  const [progress, setProgress] = useState();
  const [selectedFile, setSelectedFile] = useState(null);
  const [showVisualizationLoadingPage, setShowVisualizationLoadingPage] = useState(false);

  useEffect(() => {
    Amplify.configure({
      Auth: {
        identityPoolId: 'eu-west-3:5c0822cb-cf4a-4b2f-a235-3ddeefb0b41f', // REQUIRED - Amazon Cognito Identity Pool ID
        region: 'eu-west-3', // REQUIRED - Amazon Cognito Region
      },
      Storage: {
        AWSS3: {
          bucket: "amplifyapp6ba67f24072e4fc196fb52a34c0391ec135725-dev",
          region: "eu-west-3"
        },
        AWSS3_2: {
          bucket: "output-sales-pred", // Remplacez par le nom de la nouvelle bucket
          region: "eu-west-3" // Remplacez par la région de la nouvelle bucket
        }
      }
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
  };

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
      const authenticatedUser = user.username;
      const fileName = `${authenticatedUser}-${timestamp}#${userEmail}.csv`;

      setSelectedFile(file);

      Storage.put(fileName, file, {
        progressCallback: (progress) => {
          setProgress(Math.round((progress.loaded / progress.total) * 100) + "%");
          setTimeout(() => {
            setProgress();
          }, 1000);
        }
      })
        .then(resp => {
          console.log(resp);
          setSelectedFile(null);
          loadFiles(); // Refresh the file list after successful upload
          setShowVisualizationLoadingPage(false); // Switch back to the main page
        }).catch(err => {
          console.log(err);
          setSelectedFile(null);
        });
    } catch (error) {
      console.log("Error getting authenticated user:", error);
    }
  };

  const handleShow = (file) => {
    Storage.get(file).then(resp => {
      console.log(resp);
      setImage(resp);
    }).catch(err => {
      console.log(err);
    });
  };

  const handleDelete = (file) => {
    Storage.remove(file).then(resp => {
      console.log(resp);
      loadFiles(); // Refresh the file list after successful deletion
    }).catch(err => {
      console.log(err);
    });
  };

  const handleBackClick = () => {
    setShowVisualizationLoadingPage(false);
  };

  const handleSignOutClick = () => {
    signOut();
  };

  return (
    <View className="App">
      {showVisualizationLoadingPage ? (
        <VisualizationLoadingPage
          onBackClick={handleBackClick}
          onSignOutClick={handleSignOutClick}
        />
      ) : (
        <>
          <Card>
            <Heading level={1}> Welcome dear customer!</Heading>
          </Card>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
            <Button onClick={() => setShowVisualizationLoadingPage(true)}>Switch to Visualization Loading Page</Button>
            <Button onClick={signOut}>Sign Out</Button>
          </div>
          <input ref={ref} type="file" accept=".csv" onChange={handleFileLoad} />
          {progress}
          <table>
            <tbody>
              {Array.isArray(files) &&
                files.map((file, i) => (
                  <tr key={file.key + i}> {/* Add a unique key */}
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
        </>
      )}
    </View>
  );
}

export default withAuthenticator(App);
