import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import awsExports from './aws-exports';
import React, { useEffect, useState } from 'react';
import getUserImagesFromS3 from './s3Utils';

Amplify.configure(awsExports);

function App({ signOut, user }) {
  const [userImages, setUserImages] = useState([]);

  useEffect(() => {
    const fetchUserImages = async () => {
      try {
        const images = await getUserImagesFromS3(user.username);
        setUserImages(images);
      } catch (error) {
        console.error('Erreur lors de la récupération des images d\'utilisateur :', error);
      }
    };

    fetchUserImages();
  }, [user.username]);

  return (
    <div>
      <h1>Hello {user.username}</h1>
      <button onClick={signOut}>Sign out</button>
      
      {/* Afficher les images d'utilisateur */}
      {userImages.map((image) => (
        <img key={image.key} src={image.url} alt="User Image" />
      ))}
    </div>
  );
}

export default withAuthenticator(App);
