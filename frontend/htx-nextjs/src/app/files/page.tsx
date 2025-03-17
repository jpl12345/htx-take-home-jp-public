"use client";

import React, { useEffect, useState } from "react";
import { BACKEND_BASE_URL } from "@/constants/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AudioFile {
  file_id: string;
  description: string;
  category: string;
  file_path: string;
  upload_timestamp: string;
  upload_status: string;
  processed_data?: Record<string, unknown> | null;
  ai_processing_types?: string[] | null;
}

const FilesPage = () => {
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("All");

  // Fetch all files for the current user.
  const fetchFiles = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/files`, {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      } else {
        const errorData = await res.json();
        setError(errorData.detail || "Failed to fetch files.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    }
  };

  // Get the playback URL (pre-signed) for a given file.
  const getPlaybackUrl = async (file_id: string) => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/files/${file_id}/playback`, {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        return data.file_path;
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.detail || "Failed to get playback URL."}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      } else {
        alert(`Error: ${String(err)}`);
      }
    }
  };

  // Handle play/download button click.
  const handlePlay = async (file_id: string) => {
    const url = await getPlaybackUrl(file_id);
    if (url) {
      window.open(url, "_blank");
    }
  };

  // Handle deletion with confirmation.
  const handleDelete = async (file_id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this file?");
    if (!confirmDelete) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/files/${file_id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setFiles(files.filter((file) => file.file_id !== file_id));
      } else {
        const errorData = await res.json();
        alert(`Delete failed: ${errorData.detail || "Unknown error"}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Delete error: ${err.message}`);
      } else {
        alert(`Delete error: ${String(err)}`);
      }
    }
  };

  // Handle status refresh for a single file.
  const handleRefresh = async () => {
    await fetchFiles();
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Filter files based on search term and selected category.
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.description
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "All" || file.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Your Audio Files</h1>
      {error && <p className="text-red-500">{error}</p>}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="search" className="block mb-1">
            Search
          </Label>
          <Input
            id="search"
            type="text"
            placeholder="Search by description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="category-filter" className="block mb-1">
            Filter by Category
          </Label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Music">Music</SelectItem>
              <SelectItem value="Podcast">Podcast</SelectItem>
              <SelectItem value="Voice Note">Voice Note</SelectItem>
              <SelectItem value="Audiobook">Audiobook</SelectItem>
              <SelectItem value="Others">Others</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-end mb-4">
        <Button onClick={handleRefresh} title="Refresh Status">
          &#x21bb;
        </Button>
      </div>
      {filteredFiles.length === 0 ? (
        <p>No files uploaded yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Uploaded At</TableHead>
              <TableHead>Upload Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFiles.map((file) => (
              <TableRow key={file.file_id}>
                <TableCell>{file.description}</TableCell>
                <TableCell>{file.category}</TableCell>
                <TableCell>
                  {new Date(file.upload_timestamp).toLocaleString()}
                </TableCell>
                <TableCell>{file.upload_status}</TableCell>
                <TableCell className="space-x-2">
                  <Button
                    onClick={() => handlePlay(file.file_id)}
                    disabled={file.upload_status === "processing"}
                  >
                    Play / Download
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(file.file_id)}
                    disabled={file.upload_status === "processing"}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default FilesPage;
