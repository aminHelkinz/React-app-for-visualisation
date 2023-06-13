import AWS from 'aws-sdk';

const getUserImagesFromS3 = async (username) => {
  const s3 = new AWS.S3();

  const params = {
    Bucket: 'amplifyapp-store-images-of-users224347-dev',
    Prefix: `${username}_`
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    const images = data.Contents.map((obj) => {
      return {
        key: obj.Key,
        url: `https://amplifyapp-store-images-of-users224347-dev.s3.amazonaws.com/${obj.Key}`
      };
    });
    return images;
  } catch (error) {
    console.error('Erreur lors de la récupération des images depuis S3 :', error);
    return [];
  }
};

export default getUserImagesFromS3;
