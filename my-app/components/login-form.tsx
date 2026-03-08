"use client"
import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [mode, setMode] = useState<"login" | "register">("login")

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left column — mode tabs + social */}
            <div className="flex flex-col justify-center gap-4 border-r border-white/20 pr-6">

              {/* Login / Register toggle */}
              <div className="flex rounded-lg overflow-hidden border border-white/20">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium transition-colors",
                    mode === "login"
                      ? "bg-amber-50 text-black"
                      : "text-amber-50/60 hover:text-amber-50 hover:bg-white/10"
                  )}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium transition-colors",
                    mode === "register"
                      ? "bg-amber-50 text-black"
                      : "text-amber-50/60 hover:text-amber-50 hover:bg-white/10"
                  )}
                >
                  Register
                </button>
              </div>

              <p className="text-sm text-amber-50/60 text-center">Or sign in with</p>
              <Button variant="outline" type="button" className="w-full bg-white/10 border-white/20 text-amber-50 hover:bg-white/20 hover:text-amber-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4">
                  <path
                    d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                    fill="currentColor"
                  />
                </svg>
                Apple
              </Button>
              <Button variant="outline" type="button" className="w-full bg-white/10 border-white/20 text-amber-50 hover:bg-white/20 hover:text-amber-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                Google
              </Button>
            </div>

            {/* Right column — swaps between login and register */}
            <div className="flex flex-col justify-center min-h-[220px]">
              <AnimatePresence mode="wait">
                {mode === "login" ? (
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="email" className="text-amber-50/80">Email</FieldLabel>
                        <Input
                          id="email"
                          type="email"
                          placeholder="m@example.com"
                          required
                          className="bg-white/10 border-white/20 text-amber-50 placeholder:text-amber-50/30 focus-visible:ring-white/30"
                        />
                      </Field>
                      <Field>
                        <div className="flex items-center">
                          <FieldLabel htmlFor="password" className="text-amber-50/80">Password</FieldLabel>
                          <a href="#" className="ml-auto text-xs underline-offset-4 hover:underline text-amber-50/50 hover:text-amber-50">
                            Forgot?
                          </a>
                        </div>
                        <Input id="password" type="password" required className="bg-white/10 border-white/20 text-amber-50 placeholder:text-amber-50/30 focus-visible:ring-white/30" />
                      </Field>
                      <Field>
                        <Button type="submit" className="w-full bg-amber-50 text-black hover:bg-amber-100">Login</Button>
                      </Field>
                    </FieldGroup>
                  </motion.form>
                ) : (
                  <motion.form
                    key="register"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="name" className="text-amber-50/80">Name</FieldLabel>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Your name"
                          required
                          className="bg-white/10 border-white/20 text-amber-50 placeholder:text-amber-50/30 focus-visible:ring-white/30"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="reg-email" className="text-amber-50/80">Email</FieldLabel>
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder="m@example.com"
                          required
                          className="bg-white/10 border-white/20 text-amber-50 placeholder:text-amber-50/30 focus-visible:ring-white/30"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="reg-password" className="text-amber-50/80">Password</FieldLabel>
                        <Input id="reg-password" type="password" required className="bg-white/10 border-white/20 text-amber-50 placeholder:text-amber-50/30 focus-visible:ring-white/30" />
                      </Field>
                      <Field>
                        <Button type="submit" className="w-full bg-amber-50 text-black hover:bg-amber-100">Create account</Button>
                      </Field>
                    </FieldGroup>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-4 text-center text-xs text-amber-50/40">
        By continuing you agree to our <a href="#" className="text-amber-50/70 hover:text-amber-50 underline-offset-4 hover:underline">Terms</a> and <a href="#" className="text-amber-50/70 hover:text-amber-50 underline-offset-4 hover:underline">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
