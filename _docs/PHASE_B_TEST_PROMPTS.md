# Phase B: Agent Validation Test Prompts

This document contains test prompts to validate the AI agent's ability to use the new manipulation commands.

## Milestone 1: Core Manipulation Commands

### Prompt 1: Basic Manipulation

```
I have a frame at position (100, 100). Please:
1. Move it 50 pixels to the right
2. Duplicate it
3. Move the duplicate 100 pixels down
4. Delete the original frame
```

**Expected Result:**

- Frame moved to (150, 100)
- Duplicate created at (150, 100)
- Duplicate moved to (150, 200)
- Original frame deleted

### Prompt 2: Relative Positioning

```
Create three rectangles side by side, each 100px wide with 20px spacing between them.
Then resize the middle one to be 150px wide.
```

**Expected Result:**

- Three rectangles created: (0, 0), (120, 0), (240, 0)
- Middle rectangle resized from 100px to 150px wide

### Prompt 3: Multi-Node Operations

```
I have 5 text nodes. Move all of them 30 pixels to the right, then duplicate all of them.
```

**Expected Result:**

- All 5 text nodes moved 30px right
- All 5 text nodes duplicated (10 total nodes)

### Prompt 4: Error Handling

```
Try to delete a node that doesn't exist (ID: "fake:123"). Then create a frame and delete it successfully.
```

**Expected Result:**

- Error message for non-existent node
- Frame created successfully
- Frame deleted successfully

## Milestone 2: Grouping Commands

### Prompt 5: Grouping

```
Create 3 rectangles and 2 text nodes. Group all 5 elements together, then move the group 200 pixels to the right.
```

**Expected Result:**

- 3 rectangles and 2 text nodes created
- All 5 elements grouped together
- Group moved 200px to the right (all elements move together)

### Prompt 6: Nested Groups

```
Create two groups, each containing 2 rectangles. Then group those two groups together. Finally, ungroup everything back to individual rectangles.
```

**Expected Result:**

- Two groups created (each with 2 rectangles)
- Groups combined into one parent group
- All groups ungrouped, leaving 4 individual rectangles

### Prompt 7: Group Manipulation

```
Create a group with 4 elements. Resize the group, then ungroup it and verify all elements maintain their relative positions.
```

**Expected Result:**

- Group created with 4 elements
- Group resized
- Group ungrouped
- All 4 elements maintain their relative positions

## Milestone 3: Enhanced Properties

### Prompt 8: Gradients

```
Create a rectangle and apply a linear gradient fill from blue (top) to red (bottom).
```

**Expected Result:**

- Rectangle created
- Linear gradient applied with blue at top, red at bottom

### Prompt 9: Effects

```
Create a frame and add a drop shadow effect with 10px blur and 50% opacity.
```

**Expected Result:**

- Frame created
- Drop shadow effect added with specified blur and opacity

### Prompt 10: Complex Properties

```
Create a text node with:
- Custom line height of 1.5
- Letter spacing of 2px
- A gradient fill
- A stroke with 2px weight
```

**Expected Result:**

- Text node created
- Line height set to 1.5
- Letter spacing set to 2px
- Gradient fill applied
- 2px stroke applied

### Prompt 11: Constraints

```
Create a frame with auto-layout. Set constraints so child elements:
- Stretch horizontally
- Pin to top vertically
```

**Expected Result:**

- Frame created with auto-layout
- Constraints set: horizontal=STRETCH, vertical=MIN

### Prompt 12: Property Combinations

```
Create a rectangle with:
- Corner radius of 20px
- Linear gradient fill
- Drop shadow effect
- 2px stroke with rounded caps
- 50% opacity
```

**Expected Result:**

- Rectangle created with all specified properties applied

## Testing Instructions

1. **Start the MCP server** with bridge enabled:

   ```bash
   cd figma-mcp-server
   BRIDGE_ENABLED=true npm start
   ```

2. **Load the plugin** in Figma desktop app

3. **Connect Claude** to the MCP server

4. **Run each prompt** sequentially, verifying results in Figma

5. **Document any issues** or unexpected behavior

## Success Criteria

- All prompts execute without errors
- Visual results match expected outcomes
- Error handling works correctly
- Commands can be chained together
- Multiple nodes handled correctly
