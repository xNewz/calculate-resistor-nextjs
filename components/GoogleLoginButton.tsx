"use client";

import React, { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { googleLoginAction, linkGoogleAccountAction } from "@/app/actions/google-auth";
import { Loader2, ShieldAlert, CheckCircle2 } from "lucide-react";

interface GoogleLoginButtonProps {
  mode: "login" | "link";
  onSuccess?: () => void;
}

export default function GoogleLoginButton({ mode, onSuccess }: GoogleLoginButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId || clientId === "YOUR_GOOGLE_CLIENT_ID_HERE") {
    return (
      <div className="p-3 text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
        ระบบ Google Sign-In ยังไม่ได้รับการตั้งค่า (ขาด Client ID)
      </div>
    );
  }

  const handleSuccess = async (credentialResponse: any) => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!credentialResponse.credential) {
        throw new Error("No credential received");
      }

      if (mode === "login") {
        const result = await googleLoginAction(credentialResponse.credential);
        if (result.success) {
          if (result.role === "ADMIN") {
            router.push("/admin");
          } else {
            router.push("/classroom");
          }
        } else {
          setError(result.error || "เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google");
        }
      } else if (mode === "link") {
        const result = await linkGoogleAccountAction(credentialResponse.credential);
        if (result.success) {
          setSuccess("เชื่อมต่อบัญชี Google สำเร็จ");
          if (onSuccess) onSuccess();
        } else {
          setError(result.error || "เกิดข้อผิดพลาดในการเชื่อมต่อบัญชี Google");
        }
      }
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="flex flex-col items-center justify-center w-full space-y-3">
        {error && (
          <div className="w-full p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <ShieldAlert className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="w-full p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center gap-2 text-zinc-400 text-xs py-2">
            <Loader2 className="size-4 animate-spin" />
            <span>กำลังดำเนินการ...</span>
          </div>
        ) : (
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => {
              setError("การล็อกอินด้วย Google ล้มเหลว");
            }}
            useOneTap={mode === "login"}
            theme="filled_black"
            text={mode === "login" ? "signin_with" : "continue_with"}
            shape="rectangular"
            width="100%"
          />
        )}
      </div>
    </GoogleOAuthProvider>
  );
}
