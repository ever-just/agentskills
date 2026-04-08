# Office Open XML Technical Reference

**Important: Read this entire document before starting.** This document covers:
- [Technical Guidelines](#technical-guidelines) - Schema compliance rules and validation requirements
- [Document Content Patterns](#document-content-patterns) - XML patterns for headings, lists, tables, formatting, etc.
- [Document Library (Python)](#document-library-python) - Recommended approach for OOXML manipulation with automatic infrastructure setup
- [Tracked Changes (Redlining)](#tracked-changes-redlining) - XML patterns for implementing tracked changes

## Technical Guidelines

### Schema Compliance
- **Element ordering in ` `**: ` `, ` `, ` `, ` `
- **Whitespace**: Add `xml:space='preserve'` to ` ` elements with leading/trailing spaces
- **Unicode**: Escape characters in ASCII content: `"` becomes `&#8220;`
 - **Character encoding reference**: Curly quotes `""` become `&#8220;&#8221;`, apostrophe `'` becomes `&#8217;`, em-dash `—` becomes `&#8212;`
- **Tracked changes**: Use ` ` and ` ` tags with `w:author="Claude"` outside ` ` elements
 - **Critical**: ` ` closes with ` `, ` ` closes with ` ` - never mix
 - **RSIDs must be 8-digit hex**: Use values like `00AB1234` (only 0-9, A-F characters)
 - **trackRevisions placement**: Add ` ` after ` ` in settings.xml
- **Images**: Add to `word/media/`, reference in `document.xml`, set dimensions to prevent overflow

## Document Content Patterns

### Basic Structure
```xml
 
 Text content 
 
```

### Headings and Styles
```xml
 
 
 
 
 
 Document Title 
 

 
 
 Section Heading 
 
```

### Text Formatting
```xml
 
 Bold 
 
 Italic 
 
 Underlined 
 
 Highlighted 
```

### Lists
```xml
 
 
 
 
 
 
 
 First item 
 

 
 
 
 
 
 
 
 New list item 1 
 

 
 
 
 
 
 
 
 
 Bullet item 
 
```

### Tables
```xml
 
 
 
 
 
 
 
 
 
 
 
 Cell 1 
 
 
 
 Cell 2 
 
 
 
```

### Layout
```xml
 
 
 
 
 
 
 
 
 
 
 
 New Section Title 
 
 

 
 
 
 
 
 
 Centered text 
 

 
 
 
 
 
 Monospace text 
 

 
 
 
 
 This text is Courier New 
 
 and this text uses default font 
 
```

## File Updates

When adding content, update these files:

**`word/_rels/document.xml.rels`:**
```xml
 
 
```

**`[Content_Types].xml`:**
```xml
 
 
```

### Images
**CRITICAL**: Calculate dimensions to prevent page overflow and maintain aspect ratio.

```xml
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
```

### Links (Hyperlinks)

**IMPORTANT**: All hyperlinks (both internal and external) require the Hyperlink style to be defined in styles.xml. Without this style, links will look like regular text instead of blue underlined clickable links.

**External Links:**
```xml
 
 
 
 
 Link Text 
 
 

 
 
```

**Internal Links:**

```xml
 
 
 
 
 Link Text 
 
 

 
 
 Target content 
 
```

**Hyperlink Style (required in styles.xml):**
```xml
 
 
 
 
 
 
 
 
 
 
```

## Document Library (Python)

Use the Document class from `scripts/document.py` for all tracked changes and comments. It automatically handles infrastructure setup (people.xml, RSIDs, settings.xml, comment files, relationships, content types). Only use direct XML manipulation for complex scenarios not supported by the library.

**Working with Unicode and Entities:**
- **Searching**: Both entity notation and Unicode characters work - `contains="&#8220;Company"` and `contains="\u201cCompany"` find the same text
- **Replacing**: Use either entities (`&#8220;`) or Unicode (`\u201c`) - both work and will be converted appropriately based on the file's encoding (ascii → entities, utf-8 → Unicode)

### Initialization

**Find the docx skill root** (directory containing `scripts/` and `ooxml/`):
```bash
# Search for document.py to locate the skill root
# Note: /mnt/skills is used here as an example; check your context for the actual location
find /mnt/skills -name "document.py" -path "*/docx/scripts/*" 2>/dev/null | head -1
# Example output: /mnt/skills/docx/scripts/document.py
# Skill root is: /mnt/skills/docx
```

**Run your script with PYTHONPATH** set to the docx skill root:
```bash
PYTHONPATH=/mnt/skills/docx python your_script.py
```

**In your script**, import from the skill root:
```python
from scripts.document import Document, DocxXMLEditor

# Basic initialization (automatically creates temp copy and sets up infrastructure)
doc = Document('unpacked')

# Customize author and initials
doc = Document('unpacked', author="John Doe", initials="JD")

# Enable track revisions mode
doc = Document('unpacked', track_revisions=True)

# Specify custom RSID (auto-generated if not provided)
doc = Document('unpacked', rsid="07DC5ECB")
```

### Creating Tracked Changes

**CRITICAL**: Only mark text that actually changes. Keep ALL unchanged text outside ` `/` ` tags. Marking unchanged text makes edits unprofessional and harder to review.

**Attribute Handling**: The Document class auto-injects attributes (w:id, w:date, w:rsidR, w:rsidDel, w16du:dateUtc, xml:space) into new elements. When preserving unchanged text from the original document, copy the original ` ` element with its existing attributes to maintain document integrity.

**Method Selection Guide**:
- **Adding your own changes to regular text**: Use `replace_node()` with ` `/` ` tags, or `suggest_deletion()` for removing entire ` ` or ` ` elements
- **Partially modifying another author's tracked change**: Use `replace_node()` to nest your changes inside their ` `/` `
- **Completely rejecting another author's insertion**: Use `revert_insertion()` on the ` ` element (NOT `suggest_deletion()`)
- **Completely rejecting another author's deletion**: Use `revert_deletion()` on the ` ` element to restore deleted content using tracked changes

```python
# Minimal edit - change one word: "The report is monthly" → "The report is quarterly"
# Original: The report is monthly 
node = doc["word/document.xml"].get_node(tag="w:r", contains="The report is monthly")
rpr = tags[0].toxml() if (tags := node.getElementsByTagName("w:rPr")) else ""
replacement = f' {rpr} The report is {rpr} monthly {rpr} quarterly '
doc["word/document.xml"].replace_node(node, replacement)

# Minimal edit - change number: "within 30 days" → "within 45 days"
# Original: within 30 days 
node = doc["word/document.xml"].get_node(tag="w:r", contains="within 30 days")
rpr = tags[0].toxml() if (tags := node.getElementsByTagName("w:rPr")) else ""
replacement = f' {rpr} within {rpr} 30 {rpr} 45 {rpr} days '
doc["word/document.xml"].replace_node(node, replacement)

# Complete replacement - preserve formatting even when replacing all text
node = doc["word/document.xml"].get_node(tag="w:r", contains="apple")
rpr = tags[0].toxml() if (tags := node.getElementsByTagName("w:rPr")) else ""
replacement = f' {rpr} apple {rpr} banana orange '
doc["word/document.xml"].replace_node(node, replacement)

# Insert new content (no attributes needed - auto-injected)
node = doc["word/document.xml"].get_node(tag="w:r", contains="existing text")
doc["word/document.xml"].insert_after(node, ' new text ')

# Partially delete another author's insertion
# Original: quarterly financial report 
# Goal: Delete only "financial" to make it "quarterly report"
node = doc["word/document.xml"].get_node(tag="w:ins", attrs={"w:id": "5"})
# IMPORTANT: Preserve w:author="Jane Smith" on the outer to maintain authorship
replacement = ''' 
 quarterly 
 financial 
 report 
 '''
doc["word/document.xml"].replace_node(node, replacement)

# Change part of another author's insertion
# Original: in silence, safe and sound 
# Goal: Change "safe and sound" to "soft and unbound"
node = doc["word/document.xml"].get_node(tag="w:ins", attrs={"w:id": "8"})
replacement = f''' 
 in silence, 
 
 
 soft and unbound 
 
 
 safe and sound 
 '''
doc["word/document.xml"].replace_node(node, replacement)

# Delete entire run (use only when deleting all content; use replace_node for partial deletions)
node = doc["word/document.xml"].get_node(tag="w:r", contains="text to delete")
doc["word/document.xml"].suggest_deletion(node)

# Delete entire paragraph (in-place, handles both regular and numbered list paragraphs)
para = doc["word/document.xml"].get_node(tag="w:p", contains="paragraph to delete")
doc["word/document.xml"].suggest_deletion(para)

# Add new numbered list item
target_para = doc["word/document.xml"].get_node(tag="w:p", contains="existing list item")
pPr = tags[0].toxml() if (tags := target_para.getElementsByTagName("w:pPr")) else ""
new_item = f' {pPr} New item '
tracked_para = DocxXMLEditor.suggest_paragraph(new_item)
doc["word/document.xml"].insert_after(target_para, tracked_para)
# Optional: add spacing paragraph before content for better visual separation
# spacing = DocxXMLEditor.suggest_paragraph(' ')
# doc["word/document.xml"].insert_after(target_para, spacing + tracked_para)
```

### Adding Comments

```python
# Add comment spanning two existing tracked changes
# Note: w:id is auto-generated. Only search by w:id if you know it from XML inspection
start_node = doc["word/document.xml"].get_node(tag="w:del", attrs={"w:id": "1"})
end_node = doc["word/document.xml"].get_node(tag="w:ins", attrs={"w:id": "2"})
doc.add_comment(start=start_node, end=end_node, text="Explanation of this change")

# Add comment on a paragraph
para = doc["word/document.xml"].get_node(tag="w:p", contains="paragraph text")
doc.add_comment(start=para, end=para, text="Comment on this paragraph")

# Add comment on newly created tracked change
# First create the tracked change
node = doc["word/document.xml"].get_node(tag="w:r", contains="old")
new_nodes = doc["word/document.xml"].replace_node(
 node,
 ' old new '
)
# Then add comment on the newly created elements
# new_nodes[0] is the, new_nodes[1] is the 
doc.add_comment(start=new_nodes[0], end=new_nodes[1], text="Changed old to new per requirements")

# Reply to existing comment
doc.reply_to_comment(parent_comment_id=0, text="I agree with this change")
```

### Rejecting Tracked Changes

**IMPORTANT**: Use `revert_insertion()` to reject insertions and `revert_deletion()` to restore deletions using tracked changes. Use `suggest_deletion()` only for regular unmarked content.

```python
# Reject insertion (wraps it in deletion)
# Use this when another author inserted text that you want to delete
ins = doc["word/document.xml"].get_node(tag="w:ins", attrs={"w:id": "5"})
nodes = doc["word/document.xml"].revert_insertion(ins) # Returns [ins]

# Reject deletion (creates insertion to restore deleted content)
# Use this when another author deleted text that you want to restore
del_elem = doc["word/document.xml"].get_node(tag="w:del", attrs={"w:id": "3"})
nodes = doc["word/document.xml"].revert_deletion(del_elem) # Returns [del_elem, new_ins]

# Reject all insertions in a paragraph
para = doc["word/document.xml"].get_node(tag="w:p", contains="paragraph text")
nodes = doc["word/document.xml"].revert_insertion(para) # Returns [para]

# Reject all deletions in a paragraph
para = doc["word/document.xml"].get_node(tag="w:p", contains="paragraph text")
nodes = doc["word/document.xml"].revert_deletion(para) # Returns [para]
```

### Inserting Images

**CRITICAL**: The Document class works with a temporary copy at `doc.unpacked_path`. Always copy images to this temp directory, not the original unpacked folder.

```python
from PIL import Image
import shutil, os

# Initialize document first
doc = Document('unpacked')

# Copy image and calculate full-width dimensions with aspect ratio
media_dir = os.path.join(doc.unpacked_path, 'word/media')
os.makedirs(media_dir, exist_ok=True)
shutil.copy('image.png', os.path.join(media_dir, 'image1.png'))
img = Image.open(os.path.join(media_dir, 'image1.png'))
width_emus = int(6.5 * 914400) # 6.5" usable width, 914400 EMUs/inch
height_emus = int(width_emus * img.size[1] / img.size[0])

# Add relationship and content type
rels_editor = doc['word/_rels/document.xml.rels']
next_rid = rels_editor.get_next_rid()
rels_editor.append_to(rels_editor.dom.documentElement,
 f' ')
doc['[Content_Types].xml'].append_to(doc['[Content_Types].xml'].dom.documentElement,
 ' ')

# Insert image
node = doc["word/document.xml"].get_node(tag="w:p", line_number=100)
doc["word/document.xml"].insert_after(node, f''' 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 ''')
```

### Getting Nodes

```python
# By text content
node = doc["word/document.xml"].get_node(tag="w:p", contains="specific text")

# By line range
para = doc["word/document.xml"].get_node(tag="w:p", line_number=range(100, 150))

# By attributes
node = doc["word/document.xml"].get_node(tag="w:del", attrs={"w:id": "1"})

# By exact line number (must be line number where tag opens)
para = doc["word/document.xml"].get_node(tag="w:p", line_number=42)

# Combine filters
node = doc["word/document.xml"].get_node(tag="w:r", line_number=range(40, 60), contains="text")

# Disambiguate when text appears multiple times - add line_number range
node = doc["word/document.xml"].get_node(tag="w:r", contains="Section", line_number=range(2400, 2500))
```

### Saving

```python
# Save with automatic validation (copies back to original directory)
doc.save() # Validates by default, raises error if validation fails

# Save to different location
doc.save('modified-unpacked')

# Skip validation (debugging only - needing this in production indicates XML issues)
doc.save(validate=False)
```

### Direct DOM Manipulation

For complex scenarios not covered by the library:

```python
# Access any XML file
editor = doc["word/document.xml"]
editor = doc["word/comments.xml"]

# Direct DOM access (defusedxml.minidom.Document)
node = doc["word/document.xml"].get_node(tag="w:p", line_number=5)
parent = node.parentNode
parent.removeChild(node)
parent.appendChild(node) # Move to end

# General document manipulation (without tracked changes)
old_node = doc["word/document.xml"].get_node(tag="w:p", contains="original text")
doc["word/document.xml"].replace_node(old_node, " replacement text ")

# Multiple insertions - use return value to maintain order
node = doc["word/document.xml"].get_node(tag="w:r", line_number=100)
nodes = doc["word/document.xml"].insert_after(node, " A ")
nodes = doc["word/document.xml"].insert_after(nodes[-1], " B ")
nodes = doc["word/document.xml"].insert_after(nodes[-1], " C ")
# Results in: original_node, A, B, C
```

## Tracked Changes (Redlining)

**Use the Document class above for all tracked changes.** The patterns below are for reference when constructing replacement XML strings.

### Validation Rules
The validator checks that the document text matches the original after reverting Claude's changes. This means:
- **NEVER modify text inside another author's ` ` or ` ` tags**
- **ALWAYS use nested deletions** to remove another author's insertions
- **Every edit must be properly tracked** with ` ` or ` ` tags

### Tracked Change Patterns

**CRITICAL RULES**:
1. Never modify the content inside another author's tracked changes. Always use nested deletions.
2. **XML Structure**: Always place ` ` and ` ` at paragraph level containing complete ` ` elements. Never nest inside ` ` elements - this creates invalid XML that breaks document processing.

**Text Insertion:**
```xml
 
 
 inserted text 
 
 
```

**Text Deletion:**
```xml
 
 
 deleted text 
 
 
```

**Deleting Another Author's Insertion (MUST use nested structure):**
```xml
 
 
 
 monthly 
 
 
 
 weekly 
 
```

**Restoring Another Author's Deletion:**
```xml
 
 
 within 30 days 
 
 
 within 30 days 
 
```