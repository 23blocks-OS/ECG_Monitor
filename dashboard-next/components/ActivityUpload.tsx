'use client';

import React, { useState, useRef } from 'react';
import type { ActivitySource, FileType } from '@/types/activity';

interface ActivityUploadProps {
  userId: string;
  onUploadComplete?: (uploadId: string) => void;
  onError?: (error: string) => void;
}

export default function ActivityUpload({ userId, onUploadComplete, onError }: ActivityUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedSource, setSelectedSource] = useState<ActivitySource>('garmin');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Determine file type
      const fileName = file.name.toLowerCase();
      let fileType: FileType;
      if (fileName.endsWith('.fit')) {
        fileType = 'fit';
      } else if (fileName.endsWith('.gpx')) {
        fileType = 'gpx';
      } else if (fileName.endsWith('.tcx')) {
        fileType = 'tcx';
      } else if (fileName.endsWith('.json')) {
        fileType = 'json';
      } else {
        throw new Error('Unsupported file type. Please upload FIT, GPX, TCX, or JSON files.');
      }

      // Get pre-signed URL from API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/api/activities/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          source: selectedSource,
          file_name: file.name,
          file_type: fileType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { upload_id, s3_url } = await response.json();

      // Upload file to S3
      setUploadProgress(25);

      const uploadResponse = await fetch(s3_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': getContentType(fileType),
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }

      setUploadProgress(100);

      // Success
      if (onUploadComplete) {
        onUploadComplete(upload_id);
      }

      // Reset form
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
      setUploadProgress(0);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Upload failed');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getContentType = (fileType: FileType): string => {
    const types: Record<FileType, string> = {
      fit: 'application/octet-stream',
      gpx: 'application/gpx+xml',
      tcx: 'application/vnd.garmin.tcx+xml',
      json: 'application/json',
    };
    return types[fileType];
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Upload Activity Data</h2>
      <p className="text-gray-600 mb-6">
        Upload your Garmin or Strava activity files to match with ECG recordings
      </p>

      <div className="space-y-4">
        {/* Source selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Source
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="source"
                value="garmin"
                checked={selectedSource === 'garmin'}
                onChange={(e) => setSelectedSource(e.target.value as ActivitySource)}
                className="mr-2"
                disabled={uploading}
              />
              <span>Garmin</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="source"
                value="strava"
                checked={selectedSource === 'strava'}
                onChange={(e) => setSelectedSource(e.target.value as ActivitySource)}
                className="mr-2"
                disabled={uploading}
              />
              <span>Strava</span>
            </label>
          </div>
        </div>

        {/* File input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".fit,.gpx,.tcx,.json"
            onChange={handleFileSelect}
            disabled={uploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-2 text-sm text-gray-500">
            Supported formats: FIT, GPX, TCX, JSON
          </p>
        </div>

        {/* Upload progress */}
        {uploading && (
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          How to get your data:
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>Garmin:</strong> Download from Garmin Connect &gt; Activity &gt; Export (FIT, GPX, or TCX)</li>
          <li><strong>Strava:</strong> Go to Activity &gt; Export GPX or download bulk data from Settings &gt; Download Your Data</li>
        </ul>
      </div>
    </div>
  );
}
