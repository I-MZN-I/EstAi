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
import { motion } from "framer-motion";

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
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect users if already logged in
  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/discover");
    }
  }, [user, isUserLoading, router]);

  // Handle redirect result for Google sign-in
  useEffect(() => {
    if (auth) {
      getRedirectResult(auth)
        .then((result) => {
          if (result?.user) {
            toast({
              title: "Signed in with Google!",
              description: `Welcome back, ${result.user.displayName || "User"}.`,
            });
          }
        })
        .catch((error) => {
          console.error("Redirect sign-in failed:", error);
          toast({
            variant: "destructive",
            title: "Sign-In Failed",
            description: error.message || "An error occurred during redirect sign-in.",
          });
        });
    }
  }, [auth]);

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse space-y-4 text-center">
          <Logo className="text-4xl justify-center mb-2 animate-bounce" />
          <p className="text-muted-foreground text-sm font-sans">Connecting securely...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background relative px-4">
        <div className="w-full max-w-md p-10 bg-zinc-900/10 backdrop-blur-2xl border border-zinc-900/60 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] mx-auto text-center">
          <div className="text-center mb-6">
            <Logo className="text-4xl justify-center mb-4" />
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                <User className="w-10 h-10 text-primary" />
              </div>
            </div>
            <h2 className="font-serif text-3xl font-light text-zinc-200 mb-2 text-center">
              Welcome Back!
            </h2>
            <p className="font-sans text-xs text-zinc-400">
              You&apos;re signed in as <strong className="text-primary">{user.email || "User"}</strong>
            </p>
          </div>
          <div className="grid gap-3 mt-6">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                className="w-full bg-violet-600/90 text-white hover:bg-violet-600 font-sans text-xs uppercase tracking-wider transition-all duration-300 py-3 rounded-xl mt-4 font-semibold h-auto"
                onClick={() => router.push("/discover")}
              >
                <ArrowRight className="w-4 h-4 mr-2 inline" />
                Continue to App
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="w-full gap-2 border-white/10 hover:bg-white/5 rounded-xl h-11"
                onClick={async () => {
                  await signOut(auth);
                  toast({ title: "Signed out", description: "You have been signed out." });
                }}
              >
                <LogOut className="w-4 h-4" />
                Sign Out & Switch Account
              </Button>
            </motion.div>
          </div>
        </div>
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
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-md p-10 bg-zinc-900/10 backdrop-blur-2xl border border-zinc-900/60 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] mx-auto">
        <div className="text-center pb-6">
          <Logo className="text-4xl justify-center mb-4" />
          <h2 className="font-serif text-3xl font-light text-zinc-200 mb-2 text-center">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mt-1">
            {isSignUp
              ? "Enter your details to register"
              : "Enter your details below to log in"}
          </p>
        </div>
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        {...field}
                        disabled={isLoading}
                        className="w-full bg-transparent border-b border-zinc-800/80 focus:border-violet-500/60 transition-colors text-sm py-2 px-0 rounded-none outline-none text-zinc-100"
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
                      <FormLabel className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Password</FormLabel>
                      {!isSignUp && (
                        <Link
                          href="#"
                          className="ml-auto inline-block text-[11px] text-muted-foreground hover:text-primary font-sans"
                        >
                          Forgot password?
                        </Link>
                      )}
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                        className="w-full bg-transparent border-b border-zinc-800/80 focus:border-violet-500/60 transition-colors text-sm py-2 px-0 rounded-none outline-none text-zinc-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-2">
                <Button type="submit" className="w-full bg-violet-600/90 text-white hover:bg-violet-600 font-sans text-xs uppercase tracking-wider transition-all duration-300 py-3 rounded-xl mt-4 font-semibold h-auto" disabled={isLoading}>
                  {isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Login"}
                </Button>
              </motion.div>
            </form>
          </Form>
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5"></span>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-sans tracking-widest text-muted-foreground/60">
              <span className="bg-transparent px-3">
                Or continue with
              </span>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              className="w-full border-white/10 hover:bg-white/5 rounded-xl h-11 text-xs font-medium"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Login with Google"}
            </Button>
          </motion.div>

          <div className="mt-5 text-center text-xs font-sans text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="underline text-zinc-300 hover:text-primary transition-colors font-medium ml-1"
              disabled={isLoading}
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
