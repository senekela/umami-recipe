# Recipe Delete Feature

## Overview
Added comprehensive delete functionality allowing recipe publishers to delete their own recipes from multiple locations in the application.

## Implementation Details

### 1. Database Support
The database already has Row Level Security (RLS) policies in place that allow users to delete their own recipes:
- Policy: "Users can delete own recipes" (line 67-70 in `20260520_create_recipes_and_storage.sql`)
- Ensures only the recipe owner (`auth.uid() = owner_id`) can delete their recipes

### 2. Delete Locations

#### A. Recipe Detail Page (`src/pages/RecipeDetail.tsx`)
- **Location**: Owner actions section (visible only to recipe owner)
- **Features**:
  - Red "Delete Recipe" button with trash icon
  - Confirmation dialog with different messages for published vs draft recipes
  - Automatically deletes associated image from storage
  - Redirects to "My Recipes" page after successful deletion
- **Visual Design**: Red-themed button (red border, red background on hover) to indicate destructive action

#### B. My Recipes Page (`src/pages/MyRecipes.tsx`)
- **Location**: Hover overlay on recipe cards
- **Features**:
  - Quick access "Delete" button appears on hover alongside "Edit" button
  - Confirmation dialog with recipe title
  - Deletes image from storage
  - Automatically refreshes the recipe list after deletion
- **Visual Design**: Red button with white text, appears in top-right corner of recipe card on hover

#### C. Draft Editor Page (`src/pages/DraftEditor.tsx`)
- **Location**: Existing delete button in the editor
- **Enhanced Features**:
  - Improved confirmation messages for published vs draft recipes
  - Now properly deletes associated images from storage
  - Better error handling with user feedback
  - Redirects to "My Recipes" page after deletion

### 3. Image Cleanup
All delete operations include automatic cleanup of associated recipe images:
```typescript
if (recipe.image_url) {
  const imagePath = recipe.image_url.split('/').slice(-2).join('/')
  await supabase.storage
    .from('recipe-images')
    .remove([imagePath])
}
```

### 4. User Experience Features

#### Confirmation Dialogs
- **Published recipes**: "Are you sure you want to delete this published recipe? This action cannot be undone."
- **Draft recipes**: "Are you sure you want to delete this draft? This action cannot be undone."
- **From My Recipes page**: Includes recipe title in confirmation message

#### Visual Feedback
- Red color scheme for delete buttons to indicate destructive action
- Hover states for better interactivity
- Loading states during deletion process
- Error alerts if deletion fails

#### Navigation
- Automatic redirect to "My Recipes" page after successful deletion
- Maintains user context and flow

### 5. Security
- All delete operations respect RLS policies
- Only recipe owners can delete their recipes
- Server-side validation through Supabase RLS
- No direct database access from client

## Usage

### For Recipe Owners

1. **From Recipe Detail Page**:
   - Navigate to your published recipe
   - Scroll to the owner actions section
   - Click "Delete Recipe" button
   - Confirm the deletion

2. **From My Recipes Page**:
   - Go to "My Recipes" (/me)
   - Hover over any recipe card
   - Click the red "Delete" button that appears
   - Confirm the deletion

3. **From Draft Editor**:
   - Open any draft for editing
   - Click the trash icon button
   - Confirm the deletion

## Technical Notes

- Delete operations are atomic - if image deletion fails, the recipe is still deleted
- Images are stored in the `recipe-images` bucket with user-specific folders
- RLS policies ensure users can only delete images they own
- The `ON DELETE CASCADE` constraint on `owner_id` ensures recipes are deleted if a user account is deleted

## Future Enhancements

Potential improvements for future iterations:
- Soft delete with recovery option
- Bulk delete functionality
- Delete confirmation with password for published recipes
- Archive instead of delete option
- Deletion history/audit log