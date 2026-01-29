# Comprehensive Test Prompts for FigConnect

**Last Updated:** January 28, 2026  
**Purpose:** Stress test all current features and identify gaps

---

## Setup Instructions

1. **Start the development environment:**

   ```bash
   cd FigConnect
   npm run dev
   ```

2. **Load the plugin in Figma:**
   - Open Figma desktop app
   - Go to **Plugins** > **Development** > **Import plugin from manifest...**
   - Select `figma-plugin-bridge/manifest.json`
   - Run the plugin

3. **Connect Claude to MCP server** (if using Claude Desktop)

4. **Open a test Figma file** (or create a new one)

5. **Run prompts sequentially**, verifying results in Figma after each

---

## Category 1: Read Tools (Information Gathering)

### R1: File Structure Exploration

**Prompt:**

```
Get the complete file structure of the current Figma file. Show me the hierarchy of all frames, components, and layers.
```

**Expected:** Complete node tree with indentation showing parent-child relationships

---

### R2: Node Details Deep Dive

**Prompt:**

```
I see a frame named "Header" in the file. Get me all the detailed properties of that frame including its position, size, styles, and children.
```

**Expected:** Full JSON dump of node properties including fills, strokes, effects, constraints, etc.

---

### R3: Search by Name

**Prompt:**

```
Search for all nodes named "Button" in this file. Show me their IDs and types.
```

**Expected:** List of matching nodes with their IDs and node types

---

### R4: Search by Type

**Prompt:**

```
Find all FRAME nodes in this file. How many are there?
```

**Expected:** Count and list of all FRAME type nodes

---

### R5: Component Discovery

**Prompt:**

```
List all components defined in this file. Show me their names, IDs, and descriptions.
```

**Expected:** List of all components with metadata

---

### R6: Style Audit

**Prompt:**

```
What color styles, text styles, and effect styles are defined in this file? Show me a summary.
```

**Expected:** Categorized list of all styles (colors, text, effects)

---

### R7: Variable Discovery

**Prompt:**

```
What design variables (tokens) are available in this file? Show me the variable collections and their modes.
```

**Expected:** List of variable collections with their modes

---

### R8: Comment Reading

**Prompt:**

```
Show me all comments in this file. Who wrote them and when?
```

**Expected:** List of comments with author, timestamp, and message

---

### R9: Version History

**Prompt:**

```
What's the version history of this file? Show me the last 5 versions with labels and authors.
```

**Expected:** List of recent versions with metadata

---

### R10: Export Testing

**Prompt:**

```
Export the frame named "Hero Section" as a PNG at 2x scale. Give me the export URL.
```

**Expected:** Export URL for the PNG image

---

## Category 2: Creation Commands

### C1: Basic Frame Creation

**Prompt:**

```
Create a frame named "Test Frame" that is 400px wide and 300px tall at position (100, 100).
```

**Expected:** Frame created with exact dimensions and position

---

### C2: Frame with Auto-Layout

**Prompt:**

```
Create a frame named "Card" that is 300px wide and 200px tall. Apply auto-layout with vertical direction, 16px spacing, and 24px padding on all sides.
```

**Expected:** Frame created with auto-layout properties applied

---

### C3: Text Node Creation

**Prompt:**

```
Create a text node that says "Hello, FigConnect!" Use Inter font, size 24px, and place it at position (50, 50).
```

**Expected:** Text node created with specified content and styling

---

### C4: Rectangle Creation

**Prompt:**

```
Create a rectangle that is 200px wide and 100px tall with a corner radius of 12px. Fill it with color #FF5733.
```

**Expected:** Rectangle created with rounded corners and fill color

---

### C5: Component Creation

**Prompt:**

```
Create a component named "Primary Button" that is 120px wide and 40px tall. Fill it with blue (#0066FF) and add text "Click Me" centered inside.
```

**Expected:** Component created with nested text node

---

### C6: Nested Creation

**Prompt:**

```
Create a frame named "Container". Inside it, create three rectangles side by side, each 100px wide and 100px tall with 20px spacing between them.
```

**Expected:** Frame with three rectangles arranged horizontally

---

## Category 3: Manipulation Commands

### M1: Absolute Positioning

**Prompt:**

```
I have a frame at position (100, 100). Move it to position (500, 300).
```

**Expected:** Frame moved to exact coordinates

---

### M2: Relative Movement

**Prompt:**

```
Move the frame named "Header" 50 pixels to the right and 30 pixels down from its current position.
```

**Expected:** Frame moved relative to current position

---

### M3: Multiple Node Movement

**Prompt:**

```
I have 5 rectangles. Move all of them 100 pixels to the right simultaneously.
```

**Expected:** All 5 rectangles moved together

---

### M4: Duplicate Single Node

**Prompt:**

```
Duplicate the frame named "Card". Place the duplicate 200 pixels to the right of the original.
```

**Expected:** Duplicate created and positioned

---

### M5: Duplicate Multiple Nodes

**Prompt:**

```
I have 3 text nodes selected. Duplicate all of them and move the duplicates 50 pixels down.
```

**Expected:** 3 duplicates created and moved

---

### M6: Delete Single Node

**Prompt:**

```
Delete the rectangle named "Old Rectangle".
```

**Expected:** Rectangle removed from canvas

---

### M7: Delete Multiple Nodes

**Prompt:**

```
Delete all rectangles that are smaller than 50px x 50px.
```

**Expected:** Only small rectangles deleted (requires search + filter logic)

---

### M8: Resize Absolute

**Prompt:**

```
Resize the frame named "Container" to be exactly 600px wide and 400px tall.
```

**Expected:** Frame resized to exact dimensions

---

### M9: Resize Relative

**Prompt:**

```
Make the frame named "Card" 50px wider and 30px taller than it currently is.
```

**Expected:** Frame resized relative to current size

---

### M10: Resize with Aspect Ratio

**Prompt:**

```
Resize the rectangle named "Square" to be 200px wide, maintaining its aspect ratio.
```

**Expected:** Rectangle resized proportionally

---

## Category 4: Grouping Commands

### G1: Basic Grouping

**Prompt:**

```
I have 3 rectangles and 2 text nodes. Group all 5 elements together into a group named "Card Elements".
```

**Expected:** All 5 elements grouped together

---

### G2: Group Movement

**Prompt:**

```
Group the 4 rectangles together, then move the entire group 200 pixels to the right.
```

**Expected:** Group created and moved as a unit

---

### G3: Nested Grouping

**Prompt:**

```
Create two groups, each containing 2 rectangles. Then group those two groups together into a parent group.
```

**Expected:** Nested group structure created

---

### G4: Ungroup Single Level

**Prompt:**

```
Ungroup the group named "Card Elements". Keep all the individual elements.
```

**Expected:** Group broken apart, elements remain

---

### G5: Ungroup Nested Groups

**Prompt:**

```
I have a group containing two subgroups. Ungroup everything so all elements are individual again.
```

**Expected:** All groups ungrouped recursively

---

### G6: Group Manipulation

**Prompt:**

```
Create a group with 4 rectangles. Resize the group to be 400px wide, then ungroup it and verify all rectangles maintain their relative positions.
```

**Expected:** Group resized, then ungrouped with elements maintaining positions

---

## Category 5: Layout & Styling Commands

### S1: Auto-Layout Application

**Prompt:**

```
Apply auto-layout to the frame named "Container" with horizontal direction, 16px spacing, and 20px padding.
```

**Expected:** Auto-layout applied with specified properties

---

### S2: Auto-Layout Direction Change

**Prompt:**

```
The frame "List" currently has vertical auto-layout. Change it to horizontal auto-layout with 24px spacing.
```

**Expected:** Auto-layout direction changed

---

### S3: Basic Fill Color

**Prompt:**

```
Set the fill color of the rectangle named "Button" to #0066FF (blue).
```

**Expected:** Rectangle filled with blue color

---

### S4: Linear Gradient

**Prompt:**

```
Apply a linear gradient fill to the frame named "Hero" that goes from blue (#0066FF) at the top to purple (#9933FF) at the bottom.
```

**Expected:** Linear gradient applied vertically

---

### S5: Radial Gradient

**Prompt:**

```
Create a rectangle and apply a radial gradient fill from white in the center to black at the edges.
```

**Expected:** Radial gradient applied

---

### S6: Drop Shadow Effect

**Prompt:**

```
Add a drop shadow effect to the frame named "Card" with 10px blur, 5px offset, and 50% opacity.
```

**Expected:** Drop shadow effect added

---

### S7: Multiple Effects

**Prompt:**

```
Apply both a drop shadow and an inner shadow to the rectangle named "Button". Make the drop shadow 8px blur and the inner shadow 4px blur.
```

**Expected:** Both effects applied

---

### S8: Stroke Properties

**Prompt:**

```
Add a 2px stroke to the rectangle named "Border" with color #000000. Make it centered (strokeAlign: center).
```

**Expected:** Stroke added with specified properties

---

### S9: Stroke Caps and Joins

**Prompt:**

```
Create a rectangle with a 3px stroke. Set the stroke caps to rounded and the stroke joins to beveled.
```

**Expected:** Stroke with rounded caps and beveled joins

---

### S10: Text Properties

**Prompt:**

```
Create a text node and set the line height to 1.5, letter spacing to 2px, and paragraph spacing to 8px.
```

**Expected:** Text properties applied

---

### S11: Constraints

**Prompt:**

```
Set constraints on the frame named "Responsive" so it stretches horizontally and pins to the top vertically.
```

**Expected:** Constraints applied (horizontal: STRETCH, vertical: MIN)

---

### S12: Complex Property Combination

**Prompt:**

```
Create a rectangle with:
- Corner radius of 20px
- Linear gradient fill (blue to purple)
- Drop shadow effect (10px blur, 50% opacity)
- 2px stroke with rounded caps
- 80% opacity
```

**Expected:** All properties applied correctly

---

## Category 6: Batch Operations

### B1: Batch Creation

**Prompt:**

```
Create 5 rectangles in a batch:
- Rectangle 1: 100x100 at (0, 0)
- Rectangle 2: 100x100 at (120, 0)
- Rectangle 3: 100x100 at (240, 0)
- Rectangle 4: 100x100 at (360, 0)
- Rectangle 5: 100x100 at (480, 0)
```

**Expected:** All 5 rectangles created in sequence

---

### B2: Batch Manipulation

**Prompt:**

```
Create 3 frames, then in a batch operation:
1. Move frame 1 to (100, 100)
2. Move frame 2 to (200, 100)
3. Move frame 3 to (300, 100)
4. Resize all 3 to 150x150
```

**Expected:** All operations completed in order

---

### B3: Batch with Dependencies

**Prompt:**

```
Create a frame, then duplicate it 3 times, then group all 4 frames together, then move the group to (500, 500).
```

**Expected:** Operations executed in correct order with dependencies

---

## Category 7: Complex Workflows

### W1: Card Component Creation

**Prompt:**

```
Create a complete card component:
1. Create a frame named "Card" (300x200) with auto-layout (vertical, 16px spacing, 24px padding)
2. Add a rectangle at the top (280x120) with corner radius 8px and gradient fill
3. Add text "Card Title" below the rectangle
4. Add text "Card description text" below the title
5. Group everything together
6. Add a drop shadow to the group
```

**Expected:** Complete card component with all elements

---

### W2: Button Variants

**Prompt:**

```
Create a primary button component:
1. Create a rectangle (120x40) with corner radius 8px and blue fill
2. Add text "Button" centered inside
3. Convert to component
4. Duplicate it 3 times
5. Modify the duplicates: second one with red fill, third with green fill, fourth with gray fill
```

**Expected:** 4 button variants created

---

### W3: Layout Grid Creation

**Prompt:**

```
Create a 3-column grid layout:
1. Create a container frame (900x600) with auto-layout (horizontal, 20px spacing)
2. Create 3 column frames (280x600 each)
3. Place them in the container
4. Each column should have auto-layout (vertical, 16px spacing)
5. Add 3 rectangles to each column (280x100 each)
```

**Expected:** Complete grid layout structure

---

### W4: Design System Setup

**Prompt:**

```
Set up a basic design system:
1. Create 5 color rectangles (100x100 each) representing primary colors
2. Create 3 text styles (heading, body, caption) with different sizes
3. Group colors together, group text styles together
4. Create a frame "Design System" and place both groups inside
5. Apply auto-layout to organize everything
```

**Expected:** Organized design system structure

---

## Category 8: Edge Cases & Error Handling

### E1: Non-Existent Node

**Prompt:**

```
Try to move a node with ID "fake:12345". What happens?
```

**Expected:** Clear error message indicating node not found

---

### E2: Invalid Parameters

**Prompt:**

```
Try to create a frame with width -100px. What happens?
```

**Expected:** Validation error or graceful handling

---

### E3: Duplicate Names

**Prompt:**

```
Create 3 frames all named "Test". Then try to move the frame named "Test". Which one moves?
```

**Expected:** Either moves first match or error about ambiguity

---

### E4: Nested Operations

**Prompt:**

```
Create a frame, then try to delete it while also trying to add children to it. What happens?
```

**Expected:** Either operation succeeds, other fails gracefully

---

### E5: Large Batch

**Prompt:**

```
Create 100 rectangles in a batch operation. Does it complete successfully?
```

**Expected:** Either completes or times out gracefully

---

### E6: Circular Grouping

**Prompt:**

```
Create frame A and frame B. Group A and B together. Try to group the group with A again. What happens?
```

**Expected:** Error or prevention of circular grouping

---

### E7: Missing File Key

**Prompt:**

```
Without providing a file_key, try to get the file structure. Does it use the auto-detected file?
```

**Expected:** Uses auto-detected file or clear error message

---

### E8: Plugin Not Running

**Prompt:**

```
If the plugin isn't running, try to post a command. What error do you get?
```

**Expected:** Clear error about plugin not being available

---

## Category 9: Stress Tests

### ST1: Rapid Commands

**Prompt:**

```
Create 10 frames, then immediately move all 10, then resize all 10, then delete all 10. Do this as fast as possible.
```

**Expected:** All commands execute successfully without errors

---

### ST2: Deep Nesting

**Prompt:**

```
Create a frame. Inside it, create another frame. Inside that, create another frame. Continue nesting 10 levels deep. Then try to get details of the innermost frame.
```

**Expected:** Deep nesting works, details retrieval succeeds

---

### ST3: Many Children

**Prompt:**

```
Create a frame and add 50 rectangles as children. Apply auto-layout. Does it work?
```

**Expected:** Auto-layout handles many children

---

### ST4: Large Canvas

**Prompt:**

```
Create elements spread across a very large canvas (5000x5000). Can you still move and manipulate them?
```

**Expected:** Operations work at large coordinates

---

### ST5: Property Overload

**Prompt:**

```
Create a rectangle and apply 10 different effects, 5 different fills, and 3 strokes. Does it work?
```

**Expected:** Multiple properties applied (or error if limits exist)

---

## Category 10: Real-World Scenarios

### RW1: Dashboard Layout

**Prompt:**

```
Create a dashboard layout:
1. Main container frame (1200x800)
2. Header section (1200x80) with logo and navigation
3. Sidebar (200x720) with menu items
4. Content area (1000x720) with 4 card widgets
5. Apply auto-layout throughout
6. Add appropriate spacing and padding
```

**Expected:** Complete dashboard structure

---

### RW2: Form Creation

**Prompt:**

```
Create a form:
1. Container frame with vertical auto-layout
2. Form title text
3. 5 input fields (rectangles with labels)
4. Submit button
5. Proper spacing between elements
```

**Expected:** Form structure created

---

### RW3: Icon Set

**Prompt:**

```
Create a set of 12 icon components:
1. Each icon is a 24x24 frame
2. Arrange them in a 4x3 grid
3. Each icon has a unique name
4. Group them together
```

**Expected:** Icon set organized in grid

---

### RW4: Responsive Breakpoints

**Prompt:**

```
Create frames representing different screen sizes:
1. Mobile (375x667)
2. Tablet (768x1024)
3. Desktop (1920x1080)
4. Arrange them side by side
5. Add labels for each breakpoint
```

**Expected:** Breakpoint frames created and labeled

---

## Category 11: Integration Tests

### I1: Read Then Write

**Prompt:**

```
1. Get the file structure
2. Find a frame named "Header"
3. Get its details
4. Move it 100px to the right
5. Verify the new position
```

**Expected:** Read operations inform write operations

---

### I2: Search Then Modify

**Prompt:**

```
1. Search for all rectangles
2. Get details of the first 3
3. Apply a gradient fill to all 3
4. Group them together
```

**Expected:** Search results used for modification

---

### I3: Export Then Delete

**Prompt:**

```
1. Create a frame with some content
2. Export it as PNG
3. Get the export URL
4. Delete the frame
5. Verify it's gone
```

**Expected:** Export succeeds before deletion

---

## Success Criteria

After running all prompts, verify:

- ✅ All commands execute without crashes
- ✅ Visual results match expected outcomes
- ✅ Error messages are clear and helpful
- ✅ Batch operations complete successfully
- ✅ Complex workflows work end-to-end
- ✅ Edge cases handled gracefully
- ✅ Performance is acceptable (no significant lag)
- ✅ Auto-file detection works consistently
- ✅ Plugin remains stable throughout testing

## Issues to Document

When testing, note:

1. **Commands that fail** - What error occurred?
2. **Unexpected behavior** - What happened vs. what was expected?
3. **Performance issues** - Any slow operations?
4. **Missing features** - What would be useful but isn't available?
5. **UX problems** - What's confusing or hard to use?
6. **Error messages** - Are they helpful and actionable?

## Next Steps After Testing

Based on test results:

1. **Fix critical bugs** - Commands that fail or crash
2. **Improve error handling** - Better error messages
3. **Add missing features** - Common operations that aren't supported
4. **Optimize performance** - Slow operations
5. **Enhance documentation** - Unclear or missing docs
6. **Plan Phase A** - Comment-based collaboration features

---

**Happy Testing! 🚀**
