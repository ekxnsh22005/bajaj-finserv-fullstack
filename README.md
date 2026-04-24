# Bajaj Finserv Full Stack Challenge

A full stack submission for the SRM Full Stack Engineering Challenge. Built with Next.js, this project exposes a REST API that parses directed node edges into hierarchical trees and also serves a frontend to interact with it visually.

---

## What It Does

You send a list of strings like `["A->B", "A->C", "B->D"]` to the API, and it gives you back a structured breakdown of the trees, any cycles it found, invalid entries, and duplicate edges.

The frontend lets you paste those edges into a text box and see the result as a proper tree diagram right in the browser.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** JavaScript
- **Hosting:** Vercel

The API and frontend are both served from the same Next.js app, so there is only one deployment needed.

---

## API

### POST /bfhl

**Request**

```json
{
  "data": ["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X"]
}
```

**Response**

```json
{
  "user_id": "ekanshjindal_22092005",
  "email_id": "ej3961@srmist.edu.in",
  "college_roll_number": "RA2311026010860",
  "hierarchies": [
    {
      "root": "A",
      "tree": { "A": { "B": {}, "C": {} } },
      "depth": 2
    },
    {
      "root": "X",
      "tree": {},
      "has_cycle": true,
      "cycle_path": ["X", "Y", "Z"]
    }
  ],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```

### Rules the API follows

- Valid edges are `X->Y` where both X and Y are single uppercase letters (A-Z)
- Self-loops like `A->A` are treated as invalid
- Whitespace is trimmed before validation
- If the same edge appears more than once, only the first occurrence is used and the rest go into `duplicate_edges` (deduplicated)
- If a node has two parents, the first parent encountered wins
- Pure cycles where all nodes appear as children get the lexicographically smallest node as the root
- Depth is the number of nodes on the longest root-to-leaf path, not the number of edges

---

## Running Locally

Make sure you have Node.js 18 or higher installed.

```bash
git clone https://github.com/ekxnsh22005/bajaj-finserv-fullstack.git
cd bajaj-finserv-fullstack
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

To test the API directly from your terminal:

```bash
curl -X POST http://localhost:3000/bfhl \
  -H "Content-Type: application/json" \
  -d '{"data": ["A->B", "A->C", "B->D"]}'
```

---

## Project Structure

```
app/
  bfhl/
    route.js       API handler for POST /bfhl
  page.js          Frontend (React client component)
  page.module.css  Styles
  layout.js        Root layout
  globals.css      Base styles
```

---

## Submission Details

| Field | Value |
|---|---|
| Name | Ekansh Jindal |
| Roll Number | RA2311026010860 |
| Email | ej3961@srmist.edu.in |
| College | SRMIST |
