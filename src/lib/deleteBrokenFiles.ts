import { supabase } from '@/integrations/supabase/client';

export async function deleteBrokenFiles() {
  const brokenFiles = [
    '80e84dc4-f3da-490e-beb0-5f9d601246ab',
    '2f55a65a-bc3e-4001-9b16-db05c7fd5ce0'
  ];

  const results = {
    success: [] as string[],
    failed: [] as string[],
    notFound: [] as string[]
  };

  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('Failed to fetch users:', usersError);
    return { error: 'Failed to fetch users', results };
  }

  for (const user of users) {
    for (const fileName of brokenFiles) {
      const filePath = `${user.id}/${fileName}`;

      try {
        const { data: existingFile } = await supabase.storage
          .from('uploads')
          .list(user.id, {
            search: fileName
          });

        if (!existingFile || existingFile.length === 0) {
          continue;
        }

        const { error: deleteError } = await supabase.storage
          .from('uploads')
          .remove([filePath]);

        if (deleteError) {
          console.error(`Failed to delete ${filePath}:`, deleteError);
          results.failed.push(filePath);
        } else {
          console.log(`Successfully deleted ${filePath}`);
          results.success.push(filePath);
        }
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
        results.failed.push(filePath);
      }
    }
  }

  return { results };
}
