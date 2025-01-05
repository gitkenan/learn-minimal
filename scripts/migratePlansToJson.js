import { parseLearningPlanViewer } from '../utils/markdownParser.js';

export async function migratePlansToJson(supabase) {
  const { data: plans, error } = await supabase
    .from('plans')
    .select('*')
    .is('json_content', null); // Only get plans without JSON content

  if (error) {
    console.error('Error fetching plans:', error);
    return;
  }

  console.log(`Found ${plans.length} plans to migrate`);
  let successCount = 0;
  let errorCount = 0;

  for (const plan of plans) {
    try {
      console.log(`Processing plan ${plan.id}...`);
      const parsedContent = parseLearningPlanViewer(plan.content);
      
      // Add initial version number
      parsedContent.version = 1;
      
      const { error: updateError } = await supabase
        .from('plans')
        .update({ json_content: parsedContent })
        .eq('id', plan.id);

      if (updateError) {
        console.error(`Error updating plan ${plan.id}:`, updateError);
        errorCount++;
      } else {
        successCount++;
        console.log(`Successfully migrated plan ${plan.id}`);
      }
    } catch (error) {
      console.error(`Error processing plan ${plan.id}:`, error);
      errorCount++;
    }
  }

  console.log('\nMigration Results:');
  console.log(`- Total plans processed: ${plans.length}`);
  console.log(`- Successfully migrated: ${successCount}`);
  console.log(`- Failed to migrate: ${errorCount}`);

  return {
    total: plans.length,
    success: successCount,
    errors: errorCount
  };
}

// Helper function to run the migration
export async function runMigration(supabase) {
  console.log('Starting plan migration...');
  try {
    const results = await migratePlansToJson(supabase);
    console.log('Migration completed successfully');
    return results;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
