"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePasswordValidation } from "@/providers/usePasswordValidation";
import PasswordRequirements from "@/components/PasswordRequirements";
import { BACKEND_BASE_URL } from "@/constants/constants";
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

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDescription, setAlertDescription] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const { passwordValidations, validatePassword } = usePasswordValidation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "password") {
      validatePassword(value);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate email
    if (!validateEmail(formData.email)) {
      setAlertTitle("Invalid Email");
      setAlertDescription("Please enter a valid email address.");
      setIsSuccess(false);
      setAlertOpen(true);
      return;
    }

    // Validate password before submitting
    const isPasswordValid = validatePassword(formData.password);
    if (!isPasswordValid) {
      setAlertTitle("Invalid Password");
      setAlertDescription(
        "Please ensure your password meets all requirements."
      );
      setIsSuccess(false);
      setAlertOpen(true);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          password: formData.password,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || "Registration failed.");
      }

      setAlertTitle("Success");
      setAlertDescription(
        "Account created successfully! Please log in using your new credentials."
      );
      setIsSuccess(true);
      setAlertOpen(true);
    } catch (error: unknown) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setAlertTitle("Sign Up Failed");
      setAlertDescription(errorMessage);
      setIsSuccess(false);
      setAlertOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogAction = () => {
    setAlertOpen(false);
    if (isSuccess) {
      router.push("/login");
    }
  };

  const formatLabel = (field: string) => {
    if (field === "firstName") return "First Name";
    if (field === "lastName") return "Last Name";
    return field.charAt(0).toUpperCase() + field.slice(1);
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-[400px]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Create an Account
            </CardTitle>
            <CardDescription className="text-center">
              Sign up to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="space-y-4">
                {["username", "email", "firstName", "lastName", "password"].map(
                  (field) => (
                    <div key={field} className="space-y-2">
                      <Label htmlFor={field}>{formatLabel(field)}</Label>
                      <Input
                        id={field}
                        name={field}
                        type={
                          field === "email"
                            ? "email"
                            : field === "password"
                            ? "password"
                            : "text"
                        }
                        value={formData[field as keyof typeof formData]}
                        onChange={handleInputChange}
                        required
                      />
                      {field === "password" &&
                        formData["password"].length > 0 && (
                          <PasswordRequirements
                            validations={passwordValidations}
                          />
                        )}
                    </div>
                  )
                )}
              </div>
              <Button type="submit" className="w-full mt-6" disabled={loading}>
                {loading ? "Signing Up..." : "Sign Up"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign In
              </Link>
            </p>
            <p className="text-xs text-muted-foreground text-center">
              By signing up, you agree to our{" "}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>{alertDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAlertOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDialogAction}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
