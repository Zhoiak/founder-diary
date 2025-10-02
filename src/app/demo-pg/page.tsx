"use client";

import { AuthPgDemo } from "@/components/auth-pg-demo";

export default function DemoPgPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">PostgreSQL Migration Demo</h1>
          <p className="text-muted-foreground">
            Test the new PostgreSQL authentication and feature flags system
          </p>
        </div>
        
        <AuthPgDemo />
      </div>
    </div>
  );
}
