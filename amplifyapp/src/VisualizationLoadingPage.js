import React, { useEffect, useState } from "react";
import { API } from "aws-amplify";

function VisualizationLoadingPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const response = await API.get("apirestreact", "/client");
      setData(response.data);
    } catch (error) {
      console.log("Error fetching data:", error);
    }
  }

  return (
    <div>
      <h1>Visualization Loading Page</h1>
      <ul>
        {data.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default VisualizationLoadingPage;
