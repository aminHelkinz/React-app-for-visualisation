import React, { useEffect, useState } from "react";
import { Button, Image } from "@aws-amplify/ui-react";
import { Storage, Auth } from "aws-amplify";

function VisualizationLoadingPage({ onBackClick, onSignOutClick }) {
  const [plotImage, setPlotImage] = useState(null);

  useEffect(() => {
    const fetchLatestPlot = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        const username = user.username;
        const currentDate = new Date();
        const dateKey = Math.floor(currentDate.getTime() / 1000).toString();
        const plotKey = `${username}/${dateKey}/plot/`;

        const plotFiles = await Storage.list(plotKey, { level: "public", customPrefix: { public: 'AWSS3_2' } });
        if (Array.isArray(plotFiles) && plotFiles.length > 0) {
          const latestPlot = plotFiles[plotFiles.length - 1];
          const plotURL = await Storage.get(latestPlot.key, { level: "public", customPrefix: { public: 'AWSS3_2' } });
          setPlotImage(plotURL);
        }
      } catch (error) {
        console.log("Error fetching latest plot:", error);
      }
    };

    fetchLatestPlot();
  }, []);

  return (
    <div>
      <h1>Visualizations Loading...</h1>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={onBackClick}>Back</Button>
        <Button onClick={onSignOutClick}>Sign Out</Button>
      </div>
      {plotImage && <Image src={plotImage} alt="Visualization Plot" />}
    </div>
  );
}

export default VisualizationLoadingPage;
