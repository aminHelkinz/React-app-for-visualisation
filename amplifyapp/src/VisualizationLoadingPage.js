import React, { useEffect, useState } from "react";
import { Button, Image } from "@aws-amplify/ui-react";
import { Storage, Auth } from "aws-amplify";

function VisualizationLoadingPage({ onBackClick, onSignOutClick }) {
  const [usernameFolder, setUsernameFolder] = useState(null);
  const [dateFolders, setDateFolders] = useState([]);
  const [plotImages, setPlotImages] = useState([]);

  useEffect(() => {
    const fetchUserFolder = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        const username = user.username;
        const folders = await Storage.list("", { level: "private", customPrefix: { private: "AWSS3_2" } });

        const userFolder = folders.find((folder) => folder.key === username + "/");
        setUsernameFolder(userFolder);
      } catch (error) {
        console.log("Error fetching user folder:", error);
      }
    };

    fetchUserFolder();
  }, []);

  const fetchDateFolders = async () => {
    try {
      const folders = await Storage.list(usernameFolder.key, { level: "private", customPrefix: { private: "AWSS3_2" } });

      const dateFolders = folders.filter((folder) => folder.key.endsWith("/"));
      setDateFolders(dateFolders);
    } catch (error) {
      console.log("Error fetching date folders:", error);
    }
  };

  const handleUserFolderClick = async () => {
    if (usernameFolder) {
      fetchDateFolders();
    }
  };

  const handleDateFolderClick = async (dateFolder) => {
    try {
      const plotFiles = await Storage.list(dateFolder.key + "plot/", { level: "private", customPrefix: { private: "AWSS3_2" } });
      setPlotImages(plotFiles);
    } catch (error) {
      console.log("Error fetching plot images:", error);
    }
  };

  const handlePlotImageClick = (plotImage) => {
    const imageSrc = plotImage.key;
    // Implement the logic to display the image in a modal or new page
    console.log("Clicked on plot image:", imageSrc);
  };

  return (
    <div>
      <h1>Visualizations Loading...</h1>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={onBackClick}>Back</Button>
        <Button onClick={onSignOutClick}>Sign Out</Button>
      </div>

      {!usernameFolder && (
        <div>
          <p>Loading user folder...</p>
        </div>
      )}

      {usernameFolder && (
        <div>
          <h2>User Folder:</h2>
          <Button onClick={handleUserFolderClick}>{usernameFolder.key}</Button>

          <h2>Date Folders:</h2>
          <ul>
            {dateFolders.map((dateFolder) => (
              <li key={dateFolder.key}>
                <Button onClick={() => handleDateFolderClick(dateFolder)}>{dateFolder.key}</Button>
              </li>
            ))}
          </ul>

          <h2>Plot Images:</h2>
          <ul>
            {plotImages.map((plotImage) => (
              <li key={plotImage.key}>
                <Button onClick={() => handlePlotImageClick(plotImage)}>{plotImage.key}</Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default VisualizationLoadingPage;
