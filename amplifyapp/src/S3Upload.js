import AWS from 'aws-sdk';
import React, { useEffect } from 'react';

const s3 = new AWS.S3();

export async function uploadCsvToS3(user_id, csv_file, upload_date) {

  // Convert the timestamp to a Date object
  const upload_datetime = new Date(upload_date * 1000);

  // Format the date and time as a single string
  const folder_datetime = upload_datetime.toLocaleString().replace(/\//g, '-').replace(/:/g, '-');

  // Specify the S3 bucket name
  const bucket_name = 'csv-files-users-lydia';

  // Construct the S3 key for the file based on user and datetime
  const raw_data_folder = `raw_data/`;
  const file_name = `${user_id}_${folder_datetime}.csv`;
  const raw_data_s3_key = raw_data_folder + file_name;

  const output_folder = `output/${user_id}/output/${folder_datetime}/`;
  const plot_s3_key = output_folder + 'plot/';
  const feature_s3_key = output_folder + 'feature/';

  const params = {
    Body: csv_file,
    Bucket: bucket_name,
    Key: raw_data_s3_key
  };

  try {
    // Upload the CSV file to the raw_data folder
    await s3.putObject(params).promise();

    // Create the output folder
    await s3.putObject({
      Bucket: bucket_name,
      Key: output_folder
    }).promise();

    // Create the plot folder inside the output folder
    await s3.putObject({
      Bucket: bucket_name,
      Key: plot_s3_key
    }).promise();

    // Create the feature folder inside the output folder
    await s3.putObject({
      Bucket: bucket_name,
      Key: feature_s3_key
    }).promise();

    return {
      statusCode: 200,
      body: 'CSV file uploaded successfully'
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: `Error uploading CSV file: ${e.toString()}`
    };
  }
}

export function useUploadCsvToS3(user_id, csv_file, upload_date) {
  useEffect(() => {
    uploadCsvToS3(user_id, csv_file, upload_date);
  }, [user_id, csv_file, upload_date]);
}
