"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LogIn, LogOut, ArrowRight, User } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const checkRedirect = async () => {
      setIsLoading(true);
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          toast({ title: "Signed in!", description: "Welcome back." });
          router.push("/discover");
        }
      } catch (error: any) {
        console.error("Google sign-in redirect error:", error);
        toast({
          variant: "destructive",
          title: "Google Sign-In Failed",
          description: error.message || "Could not complete sign-in with Google.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkRedirect();
  }, [auth, router, toast]);

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // If user is already signed in, show a welcome-back screen instead of auto-redirecting
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="mx-auto max-w-sm w-full bg-card border-white/10">
          <CardHeader className="text-center">
            <Logo className="text-4xl justify-center mb-2" />
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                <User className="w-10 h-10 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold font-headline">
              Welcome Back!
            </CardTitle>
            <CardDescription>
              You&apos;re signed in as <strong className="text-primary">{user.email || "User"}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button
              className="w-full gap-2"
              onClick={() => router.push("/discover")}
            >
              <ArrowRight className="w-4 h-4" />
              Continue to App
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2 border-white/10 hover:bg-white/5"
              onClick={async () => {
                await signOut(auth);
                toast({ title: "Signed out", description: "You have been signed out." });
              }}
            >
              <LogOut className="w-4 h-4" />
              Sign Out & Switch Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
        toast({
          title: "Account created!",
          description: "You've been signed in.",
        });
      } else {
        try {
          await signInWithEmailAndPassword(auth, data.email, data.password);
          toast({ title: "Signed in!", description: "Welcome back." });
        } catch (error: any) {
          console.warn("Login attempt failed:", error.code);
          
          if (error.code === "auth/invalid-credential") {
            toast({
              variant: "destructive",
              title: "Authentication Failed",
              description: "No account found with this credential, or password incorrect. Please check your details or sign up first!",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Error",
              description: error.message || "An unexpected error occurred.",
            });
          }
        }
      }
      // The useEffect hook will handle the redirect
    } catch (error: any) {
      console.error(error);
      const code = error?.code || "";
      let description = "An unexpected error occurred.";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        description = "Invalid email or password. Please check your credentials or sign up for a new account.";
      } else if (code === "auth/too-many-requests") {
        description = "Too many failed attempts. Please try again later.";
      } else if (code === "auth/email-already-in-use") {
        description = "This email is already registered. Try signing in instead.";
      } else if (error.message) {
        description = error.message;
      }
      toast({
        variant: "destructive",
        title: isSignUp ? "Sign Up Failed" : "Login Failed",
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    // We don't await here because the redirect will interrupt the flow.
    // The result is handled by the useEffect hook.
    signInWithRedirect(auth, provider).catch((error) => {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: error.message || 'Could not start sign-in process.',
      });
      setIsLoading(false);
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full bg-card border-white/10">
        <CardHeader className="text-center">
          <Logo className="text-4xl justify-center mb-2" />
          <CardTitle className="text-2xl font-bold font-headline">
            {isSignUp ? "Create an Account" : "Welcome Back"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Enter your email and password to sign up"
              : "Enter your email below to login to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="m@example.com"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <FormLabel>Password</FormLabel>
                      {!isSignUp && (
                        <Link
                          href="#"
                          className="ml-auto inline-block text-sm underline text-muted-foreground hover:text-primary"
                        >
                          Forgot your password?
                        </Link>
                      )}
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Login"}
              </Button>
            </form>
          </Form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Login with Google"}
          </Button>

          <div className="mt-4 text-center text-sm">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="underline text-muted-foreground hover:text-primary"
              disabled={isLoading}
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
