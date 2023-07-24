import logo from './logo.svg';
import './App.css';
import { Button } from 'primereact/button';
import { useState,useEffect } from "react";
import { withAuthenticator, View,AmplifyS3Image } from "@aws-amplify/ui-react";
import { Tree } from 'primereact/tree';
import "@aws-amplify/ui-react/styles.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";  
import "primeflex/primeflex.css"
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';


import { Storage } from "aws-amplify";

function App({ signOut, user }  ) {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [fileData, setFileData] = useState();
  const [image, setImage] = useState({url:""});
  const [fileStatus, setFileStatus] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [root, setRoot] = useState("");
  

  const uploadFile = async () => {
    console.log(user);
    try {
      const fileName = `${user.username}-${Math.floor(Date.now() / 1000)}#${user.attributes.email}.csv`;
      const result = await Storage.put(fileName, fileData, {
        contentType: fileData.type,
      });
      // Show the success message
      setShowSuccessMessage(true); 
      // Hide the message after 3 seconds
      setTimeout(() => setShowSuccessMessage(false), 3000); 
  
      setFileStatus(true);
      console.log("File uploaded successfully:", result);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };
  
  
  function processStorageList(response) {
    const filesystem = {};
    // https://stackoverflow.com/questions/44759750/how-can-i-create-a-nested-object-representation-of-a-folder-structure
    const add = (source, target, item) => {
      const elements = source.split('/');
      const element = elements.shift();
      if (!element) return; // blank

      target[element] = target[element] || { __data: item }; // element;
      if (elements.length) {
        target[element] =
          typeof target[element] === 'object' ? target[element] : {};
        add(elements.join('/'), target[element], item);
      }
    };
    response.results.forEach((item) => add(item.key, filesystem, item));
    return filesystem;
  }

  function transformObject(obj, targetFolders) {
    const result = [];
    for (const key in obj) {
      const value = obj[key];
      if (key === "__data" || targetFolders.includes(key)) {
        // Skip the target folder and its children
        continue;
      }
      if (typeof value === "object" && Object.keys(value).filter(i => i !== "__data").length) {
        // Parse the key as an integer (assuming it's a timestamp in seconds)
        const timestamp = parseInt(key, 10); 
        // Convert the timestamp to a readable date or use the original key if it's not a timestamp
        const label = isNaN(timestamp) ? key : new Date(timestamp * 1000).toLocaleString(); 
        
        const children = [...transformObject(value, targetFolders)];
        result.push({
          ...value.__data,
          label: label,
          data: key,
          children: children.map(child => {
            if (child.data.endsWith(".png")) {
              // Remove the date and ".png" extension from the filename of the image
              const imageName = child.data.replace(/_\d{1,2}_\d{4}\.png$/, "").replace(".png", "");
              return { ...child, label: imageName };
            } else {
              return child;
            }
          }),
        });
      } else {
        result.push({ ...value.__data, data: key, label: key });
      }
    }
    return result;
  }
  
  
  
  

  async function listObjectsFromS3(folderName) {
    const s3Objects = await Storage.list("", {
      bucket: "output-sales-pred",
      customPrefix: {
        public: `${user.username}/${folderName}`
      },
      pageSize: 'ALL'
    });
    // Set the target folder name here (e.g., "plot")
    const targetFolder = ["features","best-hyper-param","predCSV"]; 
    const filteredChildren = transformObject(processStorageList(s3Objects), targetFolder);
    
    console.log(filteredChildren);
    setFileList(filteredChildren);
  };
  
    const handleSelect = async(event) => {
      const node = event.node
      if (node.key.endsWith(".png")) {
        try{
        console.log(node)
       
        const res= await Storage.get("",{bucket:"output-sales-pred",customPrefix: {public: `${user.username}/${node.key}`},download: true});
        console.log(res)

        const blob = await res.Body.blob()
        console.log(URL.createObjectURL(blob))
        setImage({...node,url:URL.createObjectURL(blob)})
        }
        catch (e)  {
console.error(e)
        }
      }
    }

  
  

  useEffect(() => {
    listObjectsFromS3("")
  }, []);


  return (
    <View className="App">
      
      <div>
      <h1>Hello {user.username}</h1>
      <Button onClick={signOut}>Sign out</Button>
      </div>
      <TabView>
                <TabPanel header="Show images">
                <div className="card flex align-items-start justify-content-center flex-wrap">
            <Tree className="flex md-6 align-items-center justify-content-center  font-bold border-round m-2" value={fileList}  onNodeClick={handleSelect}/>
            <div className="flex align-items-center justify-content-center  font-bold border-round m-2">
            <Card title={image.label} header={ <img alt="please select png plot" src={image.url} />} >
    <p className="m-0">
           </p>
</Card>
            </div>
      
        </div>
                </TabPanel>
                <TabPanel header="Upload Csv Files">
                <div>
        <input type="file" onChange={(e) =>  setFileData(e.target.files[0])} />
      </div>

      <div>
        <Button onClick={uploadFile}>Upload file</Button>
      </div>
      {showSuccessMessage && <div>File uploaded successfully</div>}

      {/* {fileStatus ? "File uploaded successfully" : ""} */}
                </TabPanel>
             
            </TabView>
      

      
      
    </View>
  );
}

export default withAuthenticator(App);