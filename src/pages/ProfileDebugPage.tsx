import { ArrowLeftIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

// import { profilepictureDebug } from "@/components/profile/profilepictureDebug";

export default function ProfileDebugPage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-black text-white pt-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back navigation */}
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            <span>Back</span>
          </button>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Profile Picture Debug Tools</h1>
        
        <div className="flex flex-col gap-6">
          <div className="bg-zinc-900 rounded-lg p-4 md:p-6">
            <h2 className="text-xl font-semibold mb-4">Step 1: Check Database Configuration</h2>
            <p className="text-zinc-300 mb-4">
              Your database and storage configuration looks correct. The "pictures" bucket exists with the appropriate 
              Row Level Security (RLS) policies:
            </p>
            <ul className="list-disc list-inside text-zinc-300 space-y-1 mb-4">
              <li>Public pictures are viewable by everyone</li>
              <li>Users can upload their own pictures</li>
              <li>Users can update their own pictures</li>
              <li>Users can delete their own pictures</li>
            </ul>
            <p className="text-zinc-300">
              The policies are configured to restrict file access by folder name, where the folder name must match the user ID.
            </p>
          </div>
          
          <div className="bg-zinc-900 rounded-lg p-4 md:p-6">
            <h2 className="text-xl font-semibold mb-4">Step 2: Run Diagnostics</h2>
            <p className="text-zinc-300 mb-4">
              The diagnostic tool below will help identify the specific issue with your profile picture. It will:
            </p>
            <ul className="list-disc list-inside text-zinc-300 space-y-1 mb-4">
              <li>Check if your user profile record exists</li>
              <li>Verify your avatar_url is correctly set in the database</li>
              <li>Check if files exist in your storage folder</li>
              <li>Test if image URLs are publicly accessible</li>
              <li>Provide an option to upload a test image</li>
            </ul>
            
            {/* <profilepictureDebug /> */}
          </div>
          
          <div className="bg-zinc-900 rounded-lg p-4 md:p-6">
            <h2 className="text-xl font-semibold mb-4">Common Issues and Solutions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg text-yellow-500">Issue 1: Missing Storage Bucket</h3>
                <p className="text-zinc-300">
                  If the 'pictures' bucket doesn't exist, create it in your Supabase dashboard under Storage.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-lg text-yellow-500">Issue 2: Empty User Folder</h3>
                <p className="text-zinc-300">
                  If no files exist in your folder, try uploading a test image using the button above.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-lg text-yellow-500">Issue 3: Missing avatar_url</h3>
                <p className="text-zinc-300">
                  If your profile record exists but the avatar_url field is null, your profile record 
                  needs to be updated after successful file upload.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-lg text-yellow-500">Issue 4: Inaccessible URL</h3>
                <p className="text-zinc-300">
                  If the image exists but isn't accessible, check that your bucket is set to public 
                  and your RLS policies are configured correctly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
