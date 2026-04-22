import React from "react";
import { Link } from "wouter";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  alternateAction: {
    text: string;
    linkText: string;
    href: string;
  };
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  alternateAction,
}) => {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md relative">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
              {title}
            </h1>
            <p className="text-slate-400 text-sm">{subtitle}</p>
          </div>

          {children}

          <div className="mt-8 text-center text-sm text-slate-400">
            {alternateAction.text}{" "}
            <Link
              to={alternateAction.href}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {alternateAction.linkText}
            </Link>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-xs italic">
            "Your time is limited, don't waste it."
          </p>
        </div>
      </div>
    </div>
  );
};
