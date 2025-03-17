"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BACKEND_BASE_URL } from "@/constants/constants";
import { usePasswordValidation } from "@/providers/usePasswordValidation";
import PasswordRequirements from "@/components/PasswordRequirements";

interface User {
  user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  account_type: string;
  created_at: string;
  last_logged_in: string | null;
}

type ActionType = "create" | "update" | null;

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for creating/updating a user
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
  });

  // State for the form dialog (create/update)
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // State for the delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // State for the message dialog (for success/error)
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageDescription, setMessageDescription] = useState("");
  const [messageCallback, setMessageCallback] = useState<() => void>(() => {});

  // Hook for password validations
  const { passwordValidations, validatePassword } = usePasswordValidation();

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    return emailRegex.test(email);
  };

  // Fetch users from admin endpoint
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/admin/users`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await res.json();
      setUsers(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle input changes for the form in the dialog
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "password") {
      validatePassword(value);
    }
  };

  // Open the form dialog for creating a new user
  const openCreateDialog = () => {
    setFormData({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "",
    });
    setActionType("create");
    setSelectedUserId(null);
    setFormDialogOpen(true);
  };

  // Open the form dialog for updating an existing user
  const openUpdateDialog = (user: User) => {
    setFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      password: "",
    });
    setSelectedUserId(user.user_id);
    setActionType("update");
    setFormDialogOpen(true);
  };

  // When the form dialog "Save" button is clicked, perform create or update.
  const handleFormDialogConfirm = async () => {
    // Validate email and password before proceeding.
    if (!validateEmail(formData.email)) {
      setMessageTitle("Invalid Email");
      setMessageDescription("Please enter a valid email address.");
      setMessageCallback(() => {});
      setMessageDialogOpen(true);
      return;
    }
    if (!validatePassword(formData.password) && actionType === "create") {
      setMessageTitle("Invalid Password");
      setMessageDescription("Your password does not meet the requirements.");
      setMessageCallback(() => {});
      setMessageDialogOpen(true);
      return;
    }
    setFormDialogOpen(false);
    if (actionType === "create") {
      await createUser();
    } else if (actionType === "update" && selectedUserId) {
      await updateUser(selectedUserId);
    }
  };

  // Show message dialog with title, description and a callback to run on OK.
  const showMessageDialog = (
    title: string,
    description: string,
    callback: () => void = () => {}
  ) => {
    setMessageTitle(title);
    setMessageDescription(description);
    setMessageCallback(() => callback);
    setMessageDialogOpen(true);
  };

  // Create a new user via admin endpoint
  const createUser = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          password: formData.password,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to create user");
      }
      await fetchUsers();
      showMessageDialog("Success", "User created successfully!", () => {
        setFormData({
          username: "",
          email: "",
          first_name: "",
          last_name: "",
          password: "",
        });
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        showMessageDialog("Error", `Error creating user: ${err.message}`);
      } else {
        showMessageDialog("Error", `Error creating user: ${String(err)}`);
      }
    }
  };

  // Update an existing user via admin endpoint
  const updateUser = async (userId: string) => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          password: formData.password,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to update user");
      }
      await fetchUsers();
      showMessageDialog("Success", "User updated successfully!", () => {
        setFormData({
          username: "",
          email: "",
          first_name: "",
          last_name: "",
          password: "",
        });
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        showMessageDialog("Error", `Error updating user: ${err.message}`);
      } else {
        showMessageDialog("Error", `Error updating user: ${String(err)}`);
      }
    }
  };

  // Trigger the delete confirmation dialog for a user.
  const confirmDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  // Delete a user via admin endpoint
  const deleteUser = async (userId: string) => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to delete user");
      }
      await fetchUsers();
      showMessageDialog("Success", "User deleted successfully!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        showMessageDialog("Error", `Error deleting user: ${err.message}`);
      } else {
        showMessageDialog("Error", `Error deleting user: ${String(err)}`);
      }
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-4">Admin Dashboard</h1>
      {loading && <p>Loading users...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>First Name</TableHead>
            <TableHead>Last Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Last Logged In</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.user_id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.first_name}</TableCell>
              <TableCell>{user.last_name}</TableCell>
              <TableCell>{user.account_type}</TableCell>
              <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
              <TableCell>
                {user.last_logged_in
                  ? new Date(user.last_logged_in).toLocaleString()
                  : "Never"}
              </TableCell>
              <TableCell className="space-x-2">
                <Button onClick={() => openUpdateDialog(user)}>Edit</Button>
                <Button
                  variant="destructive"
                  onClick={() => confirmDeleteUser(user)}
                  className="ml-2"
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-8">
        <Button onClick={openCreateDialog}>Create New User</Button>
      </div>

      {/* Form dialog for create/update */}
      <AlertDialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "create" ? "Create User" : "Edit User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "create"
                ? "Fill in the details to create a new user."
                : "Edit the details. Leave password blank if you do not wish to change it."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 my-4">
            <div>
              <Label>Username</Label>
              <Input
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label>First Name</Label>
              <Input
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={
                  actionType === "update"
                    ? "Leave blank to keep current password"
                    : ""
                }
                required={actionType === "create"}
              />
              {formData.password && (
                <PasswordRequirements validations={passwordValidations} />
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFormDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleFormDialogConfirm}>
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user {userToDelete?.username}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userToDelete) {
                  deleteUser(userToDelete.user_id);
                  setDeleteDialogOpen(false);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Message dialog for success/error */}
      <AlertDialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{messageTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {messageDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setMessageDialogOpen(false);
                messageCallback();
              }}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
