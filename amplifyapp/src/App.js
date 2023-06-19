import logo from "./logo.svg";
import "@aws-amplify/ui-react/styles.css";
import {
  withAuthenticator,
  Button,
  Heading,
  Image,
  View,
  Card,
} from "@aws-amplify/ui-react";
import { useEffect, useRef, useState } from "react";
import Amplify from "@aws-amplify/core";
import { Storage } from "aws-amplify";

function App({ signOut }) {
  const ref = useRef(null);
  const [files, setFiles] = useState([]);
  const [image, setImage] = useState(null);
  const [progress, setProgress] = useState();

  useEffect(() => {
    Amplify.configure({
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

  const handleFileLoad = () => {
    const file = ref.current.files[0];
    const fileName = `user_${getCurrentDateInSeconds()}.csv`; // Renommer le fichier avec le nom d'utilisateur et la date en secondes
    const folderName = `output/${getCurrentDateInSeconds()}`; // Nom du dossier de sortie avec la date en secondes

    Storage.put(`${folderName}/${fileName}`, file, {
      progressCallback: (progress) => {
        setProgress(Math.round((progress.loaded / progress.total) * 100) + "%");
        setTimeout(() => { setProgress() }, 1000);
      }
    })
      .then(resp => {
        console.log(resp);
        loadFiles();
      }).catch(err => { console.log(err); });
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

  const getCurrentDateInSeconds = () => {
    const currentDate = new Date();
    const timestamp = Math.floor(currentDate.getTime() / 1000); // Convertir la date en secondes
    return timestamp.toString();
  }

  return (
    <View className="App">
      <Card>
        <Image src={logo} className="App-logo" alt="logo" />
        <Heading level={1}>We now have Auth!</Heading>
      </Card>
      <input ref={ref} type="file" accept=".csv" onChange={handleFileLoad} />
      {progress}
      <table>
        <thead>
          <tr>
            <td></td>
            <td>Name</td>
            <td>Action</td>
          </tr>
        </thead>
        <tbody>
          {files.map((file, i) => (
            <tr key={file.key}>
              <td>{i}</td>
              <td>{file.key}</td>
              <td>
                <button onClick={() => handleShow(file.key)}>Show</button>
                <button onClick={() => handleDelete(file.key)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <img src={image} width="600" />
      <Button onClick={signOut}>Sign Out</Button>
    </View>
  );
}

export default withAuthenticator(App);
