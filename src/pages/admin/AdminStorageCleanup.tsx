import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface BrokenFile {
  bucket: string;
  userId: string;
  name: string;
  size: number;
  created_at: string;
}

export default function AdminStorageCleanup() {
  const [scanning, setScanning] = useState(false);
  const [brokenFiles, setBrokenFiles] = useState<BrokenFile[]>([]);
  const [cleaning, setCleaning] = useState(false);

  const scanForBrokenFiles = async () => {
    setScanning(true);
    const broken: BrokenFile[] = [];

    try {
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

      if (usersError) {
        toast.error("Failed to fetch users");
        console.error(usersError);
        return;
      }

      for (const user of users) {
        for (const bucket of ['uploads', 'staged'] as const) {
          const { data: files, error } = await supabase.storage
            .from(bucket)
            .list(`${user.id}/`);

          if (error) {
            console.error(`Error listing ${bucket} for user ${user.id}:`, error);
            continue;
          }

          if (files) {
            for (const file of files) {
              const size = file.metadata?.size || 0;
              if (size === 0) {
                broken.push({
                  bucket,
                  userId: user.id,
                  name: file.name,
                  size,
                  created_at: file.created_at || 'Unknown'
                });
              }
            }
          }
        }
      }

      setBrokenFiles(broken);
      toast.success(`Found ${broken.length} broken file(s)`);
    } catch (error: any) {
      console.error("Scan error:", error);
      toast.error("Failed to scan for broken files");
    } finally {
      setScanning(false);
    }
  };

  const deleteFile = async (file: BrokenFile) => {
    try {
      const { error } = await supabase.storage
        .from(file.bucket)
        .remove([`${file.userId}/${file.name}`]);

      if (error) throw error;

      setBrokenFiles(prev => prev.filter(f =>
        !(f.bucket === file.bucket && f.userId === file.userId && f.name === file.name)
      ));
      toast.success("File deleted");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(`Failed to delete: ${error.message}`);
    }
  };

  const cleanupAll = async () => {
    setCleaning(true);
    let successCount = 0;
    let failCount = 0;

    for (const file of brokenFiles) {
      try {
        const { error } = await supabase.storage
          .from(file.bucket)
          .remove([`${file.userId}/${file.name}`]);

        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error(`Failed to delete ${file.name}:`, error);
        failCount++;
      }
    }

    setCleaning(false);
    setBrokenFiles([]);
    toast.success(`Cleanup complete: ${successCount} deleted, ${failCount} failed`);
  };

  const deleteSpecificFiles = async () => {
    setCleaning(true);

    const specificFiles = [
      { bucket: 'uploads', name: '80e84dc4-f3da-490e-beb0-5f9d601246ab' },
      { bucket: 'uploads', name: '2f55a65a-bc3e-4001-9b16-db05c7fd5ce0' }
    ];

    let deletedCount = 0;

    const { data: { users } } = await supabase.auth.admin.listUsers();

    for (const user of users || []) {
      for (const file of specificFiles) {
        try {
          const { error } = await supabase.storage
            .from(file.bucket as any)
            .remove([`${user.id}/${file.name}`]);

          if (!error) {
            deletedCount++;
            console.log(`Deleted ${file.bucket}/${user.id}/${file.name}`);
          }
        } catch (error) {
          console.log(`File not found or already deleted: ${file.name}`);
        }
      }
    }

    setCleaning(false);
    toast.success(`Deleted ${deletedCount} specific file(s)`);

    await scanForBrokenFiles();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Storage Cleanup</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Scan and remove broken or corrupted files from storage
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Run cleanup operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={scanForBrokenFiles}
                disabled={scanning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  'Scan for Broken Files'
                )}
              </Button>

              <Button
                onClick={deleteSpecificFiles}
                disabled={cleaning}
                variant="destructive"
              >
                {cleaning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  'Delete Known Broken Files'
                )}
              </Button>
            </div>

            {brokenFiles.length > 0 && (
              <Button
                onClick={cleanupAll}
                disabled={cleaning}
                variant="destructive"
                className="w-full"
              >
                {cleaning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  `Delete All ${brokenFiles.length} Broken File(s)`
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {brokenFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Broken Files Found ({brokenFiles.length})
              </CardTitle>
              <CardDescription>
                These files have 0 bytes and should be removed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {brokenFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {file.bucket} • User: {file.userId.substring(0, 8)}... • {file.size} bytes
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteFile(file)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
