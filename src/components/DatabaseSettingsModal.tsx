import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertTriangle, CheckCircle, Copy, Save, RefreshCw, Trash2, HelpCircle, ExternalLink, Share2 } from 'lucide-react';
import { getActiveFirebaseConfig } from '../firebase';

interface DatabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DatabaseSettingsModal({ isOpen, onClose }: DatabaseSettingsModalProps) {
  const [config, setConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  });

  const [copied, setCopied] = useState(false);
  const [rulesCopied, setRulesCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const active = getActiveFirebaseConfig();
      setConfig({
        apiKey: active.apiKey || '',
        authDomain: active.authDomain || '',
        projectId: active.projectId || '',
        storageBucket: active.storageBucket || '',
        messagingSenderId: active.messagingSenderId || '',
        appId: active.appId || '',
      });
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value.trim() }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('yashoda_firebase_config', JSON.stringify(config));
      setSaveSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.error('Failed to save Firebase configuration:', err);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to disconnect from Firebase and return to the Mock Local database?')) {
      localStorage.removeItem('yashoda_firebase_config');
      window.location.reload();
    }
  };

  const envContent = `VITE_FIREBASE_API_KEY="${config.apiKey}"
VITE_FIREBASE_AUTH_DOMAIN="${config.authDomain}"
VITE_FIREBASE_PROJECT_ID="${config.projectId}"
VITE_FIREBASE_STORAGE_BUCKET="${config.storageBucket}"
VITE_FIREBASE_MESSAGING_SENDER_ID="${config.messagingSenderId}"
VITE_FIREBASE_APP_ID="${config.appId}"`;

  const copyToClipboard = (text: string, setCopiedState: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  const securityRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-gray-150 rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Database Sync Settings</h2>
              <p className="text-3xs text-gray-500 font-medium">Synchronize data automatically across all devices</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Status Message */}
          {saveSuccess ? (
            <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 animate-bounce text-xs">
              <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin shrink-0" />
              <div>
                <p className="font-semibold text-xs">Configuration Saved Successfully!</p>
                <p className="text-2xs text-emerald-655 text-emerald-600/90">Reloading app to establish connection to your live database...</p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-2xl flex gap-3 text-xs text-blue-800 leading-normal">
              <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs mb-1">How it works</p>
                <p className="text-2xs text-blue-700">
                  By configuring your Firebase project below, the application will connect directly to your database. 
                  Any changes you or other administrators make (check-ins, payments, room directory, etc.) will immediately 
                  sync in real-time across all devices.
                </p>
                <button
                  type="button"
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="mt-2 text-2xs font-semibold underline text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
                >
                  {showInstructions ? 'Hide Setup Instructions' : 'Show Step-by-Step Setup Guide'}
                </button>
              </div>
            </div>
          )}

          {/* Instructions Guide */}
          {showInstructions && (
            <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 space-y-4 text-xs text-gray-600 leading-relaxed animate-in slide-in-from-top-4 duration-200">
              <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-1.5">Step-by-Step Firebase Setup Guide</h3>
              
              <ol className="list-decimal list-inside space-y-2.5 text-2xs pl-1">
                <li>
                  Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-semibold inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-3 h-3" /></a> and sign in.
                </li>
                <li>
                  Click <strong>Add Project</strong>, name it (e.g., "Yashoda Hostel"), and click through to create it.
                </li>
                <li>
                  In your Project Overview screen, click the **Web icon (<code>&lt;/&gt;</code>)** to register a new Web App.
                </li>
                <li>
                  Copy the credentials from the <code>firebaseConfig</code> object shown in the setup block, and paste them into the input fields below.
                </li>
                <li>
                  In the Firebase left sidebar, click <strong>Firestore Database</strong> and click <strong>Create Database</strong> (choose production or test mode).
                </li>
                <li>
                  Go to the <strong>Rules</strong> tab in your Cloud Firestore section, and replace them with the rules below to allow device synchronization.
                </li>
              </ol>

              {/* Security Rules Box */}
              <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 mt-2.5 font-mono text-[11px] relative">
                <div className="absolute right-2.5 top-2.5">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(securityRules, setRulesCopied)}
                    className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                    title="Copy Security Rules"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {rulesCopied ? 'Copied!' : 'Copy Rules'}
                  </button>
                </div>
                <div className="text-slate-400 font-semibold mb-1 text-[10px] uppercase tracking-wider">Firestore Security Rules</div>
                <pre className="overflow-x-auto whitespace-pre-wrap">{securityRules}</pre>
              </div>
            </div>
          )}

          {/* Configuration Form */}
          <form id="firebase-config-form" onSubmit={handleSave} className="space-y-4">
            <h3 className="text-xs font-bold text-gray-800">Connection Credentials</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-2xs font-semibold text-gray-600 mb-1">Project ID</label>
                <input
                  type="text"
                  name="projectId"
                  value={config.projectId}
                  onChange={handleInputChange}
                  placeholder="e.g. yashoda-hostel-123"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-gray-50/50"
                  required
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-gray-600 mb-1">API Key</label>
                <input
                  type="text"
                  name="apiKey"
                  value={config.apiKey}
                  onChange={handleInputChange}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-gray-50/50"
                  required
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-gray-600 mb-1">Auth Domain</label>
                <input
                  type="text"
                  name="authDomain"
                  value={config.authDomain}
                  onChange={handleInputChange}
                  placeholder="e.g. yashoda-hostel-123.firebaseapp.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-gray-600 mb-1">Storage Bucket</label>
                <input
                  type="text"
                  name="storageBucket"
                  value={config.storageBucket}
                  onChange={handleInputChange}
                  placeholder="e.g. yashoda-hostel-123.appspot.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-gray-600 mb-1">Messaging Sender ID</label>
                <input
                  type="text"
                  name="messagingSenderId"
                  value={config.messagingSenderId}
                  onChange={handleInputChange}
                  placeholder="e.g. 123456789012"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-gray-600 mb-1">App ID</label>
                <input
                  type="text"
                  name="appId"
                  value={config.appId}
                  onChange={handleInputChange}
                  placeholder="e.g. 1:123456789012:web:abcdef123456"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-gray-50/50"
                />
              </div>
            </div>

            {/* Environment File Copy section */}
            {config.projectId && config.apiKey && (
              <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 mt-6 font-mono text-[11px] relative">
                <div className="absolute right-3.5 top-3.5">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(envContent, setCopied)}
                    className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                    title="Copy to Clipboard"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copied!' : 'Copy .env'}
                  </button>
                </div>
                <div className="text-slate-400 font-semibold mb-1 text-[10px] uppercase tracking-wider">Local Setup (.env format)</div>
                <pre className="overflow-x-auto whitespace-pre-wrap">{envContent}</pre>
                <p className="text-slate-500 mt-2 text-[10px] leading-normal font-sans">
                  💡 Tip: You can paste these into your local <code>.env</code> file or the Environment Variables section of your hosting provider (like Vercel) for permanent out-of-the-box sync on all devices.
                </p>
              </div>
            )}

            {/* Share Connection Link */}
            {config.projectId && config.apiKey && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-indigo-900 leading-normal">
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-xs mb-0.5">Share Live Sync Link</p>
                  <p className="text-2xs text-slate-500 leading-normal">
                    Generate a link with this Firebase connection profile pre-loaded. Sharing this link with other members lets them automatically sync with your database immediately!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const cleanConfig = {
                      apiKey: config.apiKey,
                      authDomain: config.authDomain,
                      projectId: config.projectId,
                      storageBucket: config.storageBucket,
                      messagingSenderId: config.messagingSenderId,
                      appId: config.appId
                    };
                    const encoded = btoa(JSON.stringify(cleanConfig));
                    const shareUrl = `${window.location.origin}${window.location.pathname}?db_sync=${encoded}`;
                    copyToClipboard(shareUrl, setShareUrlCopied);
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold rounded-xl text-2xs transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 self-start sm:self-center shadow-xs border-0"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {shareUrlCopied ? 'Link Copied!' : 'Copy Shareable Link'}
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t border-gray-150 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                {localStorage.getItem('yashoda_firebase_config') && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-2 rounded-xl transition-all cursor-pointer font-semibold"
                  >
                    <Trash2 className="w-4 h-4" />
                    Disconnect & Use Mock Mode
                  </button>
                )}
              </div>
              
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm shadow-indigo-100"
                >
                  <Save className="w-4 h-4" />
                  Save & Connect
                </button>
              </div>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
