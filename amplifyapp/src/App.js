import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Route, Switch, Link } from "react-router-dom";
import { withAuthenticator, Button, Heading, Image, View, Card } from "@aws-amplify/ui-react";
import { Amplify, Storage } from "aws-amplify";
import { Auth } from "@aws-amplify/auth";
import VisualizationPage from "./VisualizationPage";

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
          pageSize: 1000
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
  }, [files]); // Refresh the file list when `files` state changes

  const handleFileLoad = async () => {
    const file = ref.current.files[0];
    const currentDate = new Date();
    const timestamp = Math.floor(currentDate.getTime() / 1000);

    if (selectedFile) {
      console.log("A file is already selected. Please upload one file at a time.");
      return;
    }
    if (!file || file.size === 0) {
      console.log("Please select a non-empty file.");
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
          setTimeout(() => { setProgress() }, 1000);
        }
      })
        .then(resp => {
          console.log(resp);
          setSelectedFile(null);
          loadFiles(); // Refresh the file list after successful upload
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
    <Router>
      <View className="App">
        <Card>
          <Heading level={1}>Welcome dear customer!</Heading>
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
        <Link to="/visualization">Go to Visualization Page</Link>
      </View>

      <Switch>
        <Route path="/visualization" component={VisualizationPage} />
      </Switch>
    </Router>
  );
}

export default withAuthenticator(App);
