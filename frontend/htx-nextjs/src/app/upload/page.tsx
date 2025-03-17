"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const UploadPage = () => {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Music");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDescription, setAlertDescription] = useState("");
  const [alertAction, setAlertAction] = useState<() => void>(() => {});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setDescription("");
    setCategory("Music");
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setMessage("Please select an audio file.");
      return;
    }

    const params = new URLSearchParams({
      description,
      category,
    });
    const url = `${BACKEND_BASE_URL}/files/upload?${params.toString()}`;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        // prompt the user with options.
        setAlertTitle("Upload Successful");
        setAlertDescription(
          "Your file was uploaded successfully. Would you like to view your files or upload another file?"
        );
        setAlertAction(() => () => {
          router.push("/files");
        });
        setAlertOpen(true);
        resetForm();
      } else {
        const errorData = await res.json();
        setAlertTitle("Upload Failed");
        setAlertDescription(`Upload failed: ${errorData.detail}`);
        setAlertAction(() => () => {
          setAlertOpen(false);
        });
        setAlertOpen(true);
      }
    } catch (error: unknown) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setAlertTitle("Upload Error");
      setAlertDescription(`Upload error: ${errorMessage}`);
      setAlertAction(() => () => {
        setAlertOpen(false);
      });
      setAlertOpen(true);
    }
  };

  return (
    <div className="flex justify-center items-start pt-8 px-4">
      <div className="w-full max-w-md p-6 bg-white shadow-md rounded-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Upload Audio File
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          Approved formats: audio/mpeg, audio/wav, audio/mp3, audio/ogg,
          application/ogg. Maximum file size: 1GB.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="description" className="block mb-1 text-left">
              Description
            </Label>
            <Input
              id="description"
              type="text"
              placeholder="Enter a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="category" className="block mb-1 text-left">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Music">Music</SelectItem>
                <SelectItem value="Podcast">Podcast</SelectItem>
                <SelectItem value="Voice Note">Voice Note</SelectItem>
                <SelectItem value="Audiobook">Audiobook</SelectItem>
                <SelectItem value="Others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="file" className="block mb-1 text-left">
              Audio File
            </Label>
            <Input
              id="file"
              type="file"
              accept="audio/*"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                }
              }}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Upload
          </Button>
        </form>
        {message && (
          <p className="mt-4 text-left text-sm text-gray-700">{message}</p>
        )}
      </div>

      {/* AlertDialog for showing errors or post-upload options */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>{alertDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {/* If upload was successful, show two options: "View Files" and "Upload Another" */}
            {alertTitle === "Upload Successful" ? (
              <>
                <AlertDialogAction onClick={alertAction}>
                  View Files
                </AlertDialogAction>
                <AlertDialogCancel
                  onClick={() => {
                    setAlertOpen(false);
                  }}
                >
                  Upload Another
                </AlertDialogCancel>
              </>
            ) : (
              // For errors, just a single OK button.
              <AlertDialogAction onClick={alertAction}>OK</AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UploadPage;
