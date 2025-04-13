import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export function profilepictureDebug() {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [filesInBucket, setFilesInBucket] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  
  const runDiagnostics = async () => {
    if (!user) {
      setDebugInfo({ error: 'User not authenticated' });
      return;
    }
    
    setIsLoading(true);
    const diagnosticResults: any = {
      userId: user.id,
      timestamp: new Date().toISOString(),
      steps: {}
    };
    
    try {
      // Step 1: Check if the pictures bucket exists
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();
      
      diagnosticResults.steps.bucketsCheck = {
        success: !bucketsError,
        error: bucketsError?.message,
        buckets: buckets?.map(b => b.name)
      };
      
      const picturesBucketExists = buckets?.some(b => b.name === 'pictures');
      diagnosticResults.steps.picturesBucketExists = picturesBucketExists;
      
      // Step 2: Check user's folder in pictures bucket
      const { data: userFiles, error: userFilesError } = await supabase
        .storage
        .from('pictures')
        .list(user.id);
      
      diagnosticResults.steps.userFolderCheck = {
        success: !userFilesError,
        error: userFilesError?.message,
        filesCount: userFiles?.length || 0,
        files: userFiles
      };
      
      setFilesInBucket(userFiles || []);
      
      // Step 3: Check profile record
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      diagnosticResults.steps.profileCheck = {
        success: !profileError,
        error: profileError?.message,
        profile: profile
      };
      
      setProfileData(profile);
      
      // Step 4: Try to get public URL for an image if it exists
      let publicUrlResult: { success: boolean, error?: string, url?: string, file?: string, fullPath?: string, accessible?: boolean, status?: number, fetchError?: string } = { success: false, error: 'No files found' };
      
      if (userFiles && userFiles.length > 0) {
        const mostRecentFile = userFiles
          .filter(file => !file.name.endsWith('/'))
          .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
          
        if (mostRecentFile) {
          const { data: urlData } = supabase.storage
            .from('pictures')
            .getPublicUrl(`${user.id}/${mostRecentFile.name}`);
            
          publicUrlResult = {
            success: true,
            url: urlData.publicUrl,
            file: mostRecentFile.name,
            fullPath: `${user.id}/${mostRecentFile.name}`
          };
          
          // Test if URL is accessible
          try {
            const testResult = await fetch(urlData.publicUrl, { method: 'HEAD' });
            publicUrlResult.accessible = testResult.ok;
            publicUrlResult.status = testResult.status;
          } catch (fetchErr) {
            publicUrlResult.accessible = false;
            publicUrlResult.fetchError = (fetchErr as Error).message;
          }
        }
      }
      
      diagnosticResults.steps.publicUrlCheck = publicUrlResult;
      
      // Final diagnostic information
      setDebugInfo(diagnosticResults);
    } catch (err) {
      setDebugInfo({
        error: 'Diagnostic failed',
        details: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const uploadTestImage = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Create a small canvas with text
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'skyblue';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = 'navy';
        ctx.font = '12px Arial';
        ctx.fillText('Test Image', 10, 50);
        ctx.fillText(new Date().toISOString().split('T')[0], 10, 70);
      }
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => 
        canvas.toBlob((b) => resolve(b!), 'image/png')
      );
      
      // Upload to Supabase
      const fileName = `${user.id}/test-${Date.now()}.png`;
      const { error } = await supabase.storage
        .from('pictures')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('pictures')
        .getPublicUrl(fileName);
        
      // Update profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // Run diagnostics again
      await runDiagnostics();
      
    } catch (err) {
      setDebugInfo({
        ...debugInfo,
        testUploadError: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      runDiagnostics();
    }
  }, [user]);
  
  return (
    <div className="p-6 bg-zinc-900 text-white rounded-lg">
      <h2 className="text-xl font-bold mb-4">Profile Picture Diagnostics</h2>
      
      {user ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-800 p-4 rounded">
              <h3 className="font-medium mb-2">User Info</h3>
              <div className="text-sm space-y-1">
                <p><span className="text-zinc-400">ID:</span> {user.id}</p>
                <p><span className="text-zinc-400">Email:</span> {user.email}</p>
              </div>
            </div>
            
            <div className="bg-zinc-800 p-4 rounded">
              <h3 className="font-medium mb-2">Profile Data</h3>
              {profileData ? (
                <div className="text-sm space-y-1">
                  <p><span className="text-zinc-400">Full Name:</span> {profileData.full_name || 'Not set'}</p>
                  <p><span className="text-zinc-400">Avatar URL:</span> {profileData.avatar_url || 'Not set'}</p>
                </div>
              ) : (
                <p className="text-sm text-zinc-400">No profile data found</p>
              )}
            </div>
          </div>
          
          <div className="bg-zinc-800 p-4 rounded mb-6">
            <h3 className="font-medium mb-2">Files in Storage</h3>
            {filesInBucket.length > 0 ? (
              <ul className="text-sm space-y-1">
                {filesInBucket.map((file, i) => (
                  <li key={i} className="flex items-start text-zinc-300">
                    <span className="text-zinc-400 mr-2">{i+1}.</span>
                    <div>
                      <p>{file.name}</p>
                      <p className="text-xs text-zinc-500">
                        Size: {Math.round(file.metadata?.size / 1024)} KB | 
                        Created: {new Date(file.created_at).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-400">No files found in your storage</p>
            )}
          </div>
          
          {debugInfo.steps?.publicUrlCheck?.url && (
            <div className="bg-zinc-800 p-4 rounded mb-6">
              <h3 className="font-medium mb-2">Image Preview</h3>
              <div className="flex flex-col items-center">
                <img 
                  src={debugInfo.steps.publicUrlCheck.url} 
                  alt="Profile image" 
                  className="w-32 h-32 object-cover rounded-full mb-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=Error';
                    (e.target as HTMLImageElement).title = 'Failed to load image';
                  }}
                />
                <p className="text-xs text-zinc-400 break-all">
                  {debugInfo.steps.publicUrlCheck.url}
                </p>
                <p className="text-xs text-green-500 mt-1">
                  {debugInfo.steps.publicUrlCheck.accessible 
                    ? '✓ Image is accessible' 
                    : '✗ Image is not accessible'}
                </p>
              </div>
            </div>
          )}
          
          <div className="flex space-x-4 mb-6">
            <Button 
              onClick={runDiagnostics} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Running...' : 'Run Diagnostics'}
            </Button>
            
            <Button 
              onClick={uploadTestImage} 
              disabled={isLoading}
            >
              Upload Test Image
            </Button>
          </div>
          
          <div className="bg-zinc-800 p-4 rounded">
            <h3 className="font-medium mb-2">Diagnostic Results</h3>
            <pre className="bg-black p-2 rounded text-xs overflow-auto max-h-60">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </>
      ) : (
        <p className="text-zinc-400">Please log in to run diagnostics</p>
      )}
    </div>
  );
}
