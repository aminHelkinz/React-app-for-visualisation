import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import '@aws-amplify/ui-react/styles.css';
import { withAuthenticator, Button, Heading, Image, View, Card } from '@aws-amplify/ui-react';
import { Auth } from 'aws-amplify';
import { useUploadCsvToS3 } from './S3Upload';

function App({ signOut }) {
  const [username, setUsername] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [uploadDate, setUploadDate] = useState(null);

  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then((user) => {
        setUsername(user.username);
      })
      .catch((error) => {
        console.log('Erreur lors de la récupération de l\'utilisateur authentifié :', error);
      });
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCsvFile(file);
      setUploadDate(file.lastModified);
    }
  };

  useUploadCsvToS3(username, csvFile, uploadDate);

  return (
    <View className="App">
      <Card>
        <Image src={logo} className="App-logo" alt="logo" />
        <Heading level={1}>We now have Auth!</Heading>
      </Card>
      <input type="file" onChange={handleFileChange} />
      <Button onClick={signOut}>Sign Out</Button>
    </View>
  );
}

export default withAuthenticator(App);
