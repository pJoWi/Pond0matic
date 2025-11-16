# Multi-Agent Workflow Guide

**Pond0x Dashboard - Agent Collaboration Strategy**

This guide explains how to effectively use multiple specialized agents to build, maintain, and enhance your Pond0x Dashboard project.

## 🤖 Available Agents

Your project has **7 specialized agents** located in `.claude/agents/`:

### 1. **code-refactorer** 🔴
**Purpose**: Code cleanup, restructuring, and readability improvements
**Use when**:
- Code is messy or hard to read
- Need better variable/function names
- Want to remove dead code
- Need consistent formatting
- Want to add helpful comments

**Example commands**:
```
"Refactor the SwapConfigPanel component for better readability"
"Clean up this function and improve variable names"
"Remove all dead code from the components directory"
```

---

### 2. **comprehensive-code-reviewer**
**Purpose**: Thorough code review and quality assurance
**Use when**:
- Completing a feature
- Before committing major changes
- Need security audit
- Want performance optimization suggestions
- Need to catch potential bugs

**Example commands**:
```
"Review the swap execution logic for bugs and security issues"
"Audit the wallet integration code"
"Check this component for performance issues"
```

---

### 3. **nextjs-ui-designer**
**Purpose**: Next.js-specific UI implementation and optimization
**Use when**:
- Building new Next.js components
- Need App Router guidance
- Implementing client/server patterns
- Want Next.js best practices
- Need routing/layout help

**Example commands**:
```
"Design a new /analytics page using Next.js App Router"
"Help me structure the app directory for the new mining dashboard"
"Optimize this component for Next.js 15 patterns"
```

---

### 4. **pond0x-mechanics-analyst** 🟢
**Purpose**: Protocol mechanics, tokenomics, and game theory analysis
**Use when**:
- Understanding Pond0x protocol design
- Analyzing swap modes and their purpose
- Evaluating fee structures
- Understanding vault economics
- Strategic protocol decisions

**Example commands**:
```
"Explain the game theory behind the micro-swap mode"
"Analyze the affiliate vault system economics"
"Why does roundtrip mode require >10 USD?"
"How should I design the boost accumulation strategy?"
```

---

### 5. **premium-ux-designer** 💗
**Purpose**: UX/UI enhancement and premium visual design
**Use when**:
- Need to improve visual design
- Want premium-looking interfaces
- Optimizing user flows
- Adding micro-interactions
- Enhancing accessibility

**Example commands**:
```
"Make the compact swapper look more premium"
"Design a better user flow for the auto-swap configuration"
"Add premium animations to the mining rig dashboard"
"Improve the visual hierarchy of the status display"
```

---

### 6. **solana-blockchain-guide**
**Purpose**: Solana blockchain integration and best practices
**Use when**:
- Implementing wallet connections
- Building transaction flows
- Working with Solana Web3.js
- Optimizing RPC calls
- Understanding Solana-specific patterns

**Example commands**:
```
"How should I structure the transaction signing flow?"
"Optimize the balance fetching logic"
"Implement proper error handling for failed transactions"
"Help me integrate with Jupiter API correctly"
```

---

### 7. **ui-design-enhancer**
**Purpose**: General UI improvements and design system consistency
**Use when**:
- Standardizing design patterns
- Creating reusable components
- Building a design system
- Ensuring visual consistency
- Implementing theming

**Example commands**:
```
"Create a consistent design system for the dashboard"
"Build reusable card components"
"Ensure all buttons follow the same style"
"Implement dark/light mode properly"
```

---

## 🔄 Multi-Agent Workflows

### Workflow 1: Building a New Feature

**Step-by-step agent usage**:

```
1. Planning Phase
   └─> pond0x-mechanics-analyst
       "Analyze the protocol requirements for this feature"

2. Design Phase
   └─> premium-ux-designer
       "Design the user flow and visual interface"
   └─> nextjs-ui-designer
       "How should I structure this in the Next.js App Router?"

3. Implementation Phase
   └─> solana-blockchain-guide
       "Help implement the Solana integration"
   └─> ui-design-enhancer
       "Ensure consistency with existing design patterns"

4. Refinement Phase
   └─> code-refactorer
       "Clean up and improve code readability"
   └─> comprehensive-code-reviewer
       "Review for bugs, security, and performance"
```

**Example: Adding a Portfolio Tracker**

```bash
# Step 1: Understand mechanics
"@pond0x-mechanics-analyst: What token balances should we track and why?"

# Step 2: Design UX
"@premium-ux-designer: Design a premium portfolio dashboard layout"

# Step 3: Structure in Next.js
"@nextjs-ui-designer: Create the /portfolio route with proper data fetching"

# Step 4: Implement blockchain logic
"@solana-blockchain-guide: Build the multi-wallet balance fetching logic"

# Step 5: Refine code
"@code-refactorer: Clean up the portfolio components"

# Step 6: Final review
"@comprehensive-code-reviewer: Review the portfolio feature for launch"
```

---

### Workflow 2: Improving Existing Code

**Cleanup and Enhancement Pipeline**:

```
1. Code Review
   └─> comprehensive-code-reviewer
       "Audit the current state and identify issues"

2. Refactoring
   └─> code-refactorer
       "Clean up code based on review findings"

3. UX Enhancement
   └─> premium-ux-designer
       "Improve the visual design and user experience"

4. Final Polish
   └─> ui-design-enhancer
       "Ensure consistency with design system"
```

**Example: Improving SwapConfigPanel**

```bash
# Step 1: Review current state
"@comprehensive-code-reviewer: Review SwapConfigPanel.tsx"

# Step 2: Clean up code
"@code-refactorer: Refactor based on the review findings"

# Step 3: Enhance UX
"@premium-ux-designer: Make the config panel more intuitive and premium"

# Step 4: Ensure consistency
"@ui-design-enhancer: Align with the dashboard design system"
```

---

### Workflow 3: Adding Latest Design Technologies

**Modern Design Stack Integration**:

```
1. Research & Plan
   └─> premium-ux-designer
       "Recommend latest design technologies for a premium crypto dashboard"

2. UI Architecture
   └─> nextjs-ui-designer
       "How to integrate [Framer Motion/shadcn/etc] with Next.js App Router?"

3. Design System
   └─> ui-design-enhancer
       "Build a component library with [chosen technology]"

4. Implementation
   └─> code-refactorer
       "Migrate existing components to the new design system"
```

**Example: Adding Framer Motion Animations**

```bash
# Step 1: Get recommendations
"@premium-ux-designer: What animation library should we use for premium micro-interactions?"

# Step 2: Integration strategy
"@nextjs-ui-designer: How to integrate Framer Motion with our Next.js App Router setup?"

# Step 3: Build components
"@ui-design-enhancer: Create animated card and button components"

# Step 4: Migrate existing
"@code-refactorer: Refactor CompactSwapper to use Framer Motion"
```

---

### Workflow 4: Protocol Integration

**Adding New Pond0x Features**:

```
1. Mechanics Analysis
   └─> pond0x-mechanics-analyst
       "Analyze the protocol mechanics for [new feature]"

2. Blockchain Implementation
   └─> solana-blockchain-guide
       "Build the Solana integration for [new feature]"

3. UI Design
   └─> premium-ux-designer
       "Design the user interface for [new feature]"

4. Code Quality
   └─> code-refactorer + comprehensive-code-reviewer
       "Polish and review implementation"
```

**Example: Adding Mining Rig Monitoring**

```bash
# Step 1: Understand mechanics
"@pond0x-mechanics-analyst: Explain the mining rig boost formula and contract interactions"

# Step 2: Build integration
"@solana-blockchain-guide: Implement contract reads for boost, sessions, and health data"

# Step 3: Design dashboard
"@premium-ux-designer: Design a real-time mining rig monitoring interface"
"@nextjs-ui-designer: Create the /mining route with live data updates"

# Step 4: Refine
"@code-refactorer: Clean up the mining dashboard code"
"@comprehensive-code-reviewer: Security audit for contract interactions"
```

---

## 📋 Agent Invocation Syntax

### Method 1: Direct Request (Recommended)
```
"@agent-name: your request here"
```

Example:
```
"@code-refactorer: Clean up the useSwapExecution hook"
```

### Method 2: Explicit Tool Usage
```
Use the code-refactorer agent to clean up this code
```

### Method 3: Contextual Request
```
I need to refactor this component [paste code]
```
(Claude will automatically invoke the appropriate agent)

---

## 🎯 Agent Selection Guide

**Quick Reference**:

| Task | Primary Agent | Secondary Agent |
|------|---------------|-----------------|
| Clean messy code | code-refactorer | - |
| Review before commit | comprehensive-code-reviewer | - |
| Build new Next.js page | nextjs-ui-designer | premium-ux-designer |
| Understand protocol | pond0x-mechanics-analyst | - |
| Improve visual design | premium-ux-designer | ui-design-enhancer |
| Solana integration | solana-blockchain-guide | - |
| Design system | ui-design-enhancer | premium-ux-designer |
| New feature (full) | Use workflow (see above) | - |

---

## 🔥 Power User Tips

### Tip 1: Chain Multiple Agents
```bash
# Sequential agent usage
"@pond0x-mechanics-analyst: Analyze boost mechanics"
# [wait for response]
"@solana-blockchain-guide: Now implement the boost tracking"
# [wait for response]
"@premium-ux-designer: Design a UI to display this data"
```

### Tip 2: Context Preservation
Agents have access to conversation history, so you can reference previous work:
```bash
"@code-refactorer: Clean up that component we just discussed"
"@premium-ux-designer: Use the same design language as the swapper we built earlier"
```

### Tip 3: Parallel Work
For independent tasks, you can work on multiple features:
```bash
# Morning: Work on analytics with one agent
"@nextjs-ui-designer: Build the /analytics route"

# Afternoon: Improve existing UI with another agent
"@premium-ux-designer: Enhance the compact swapper design"
```

### Tip 4: Iterative Refinement
```bash
"@premium-ux-designer: Design a mining dashboard"
# [Review output]
"Can you make it more cyberpunk-themed with neon accents?"
# [Review again]
"Perfect! Now add loading states"
```

### Tip 5: Agent Specialization
Match the task complexity to agent expertise:
- Simple CSS tweaks → Direct request (no agent needed)
- Component refactoring → code-refactorer
- Complete feature design → Multiple agents in sequence

---

## 📦 Creating Custom Agents (Advanced)

You can create new agents for specific needs:

**Location**: `.claude/agents/your-agent-name.md`

**Template**:
```markdown
---
name: your-agent-name
description: Clear description of when to use this agent
model: sonnet
color: blue
---

[Agent instructions and expertise...]
```

**Suggested Custom Agents**:

1. **documentation-writer** - Auto-generate docs and README files
2. **test-engineer** - Write comprehensive Vitest test suites
3. **performance-optimizer** - Optimize React rendering and bundle size
4. **accessibility-auditor** - WCAG compliance and a11y improvements
5. **api-architect** - Design Next.js API routes and backend logic

---

## 🚀 Example: Complete Feature Development

**Task**: Add a "Transaction History" page

```bash
# 1. Analyze protocol mechanics
"@pond0x-mechanics-analyst: What transaction data should we track from Jupiter swaps?"

# Response: Agent explains swap events, confirmation states, fees, etc.

# 2. Design the UX
"@premium-ux-designer: Design a premium transaction history interface with filtering and search"

# Response: Agent provides detailed UX specs

# 3. Structure in Next.js
"@nextjs-ui-designer: Create the /history route with data fetching and pagination"

# Response: Agent provides Next.js App Router implementation

# 4. Implement Solana integration
"@solana-blockchain-guide: Build transaction history fetching from Solana RPC"

# Response: Agent provides blockchain logic

# 5. Build consistent UI
"@ui-design-enhancer: Create reusable TransactionCard and FilterPanel components"

# Response: Agent builds design system components

# 6. Refactor for clarity
"@code-refactorer: Clean up the history page components"

# Response: Agent refactors code

# 7. Final review
"@comprehensive-code-reviewer: Review the transaction history feature"

# Response: Agent provides security audit and optimization suggestions

# 8. Launch! 🚀
```

---

## 📚 Best Practices

### ✅ DO:
- Use specific agent for their expertise
- Provide context when switching agents
- Review agent output before next step
- Chain agents for complex features
- Keep conversation focused per task

### ❌ DON'T:
- Ask code-refactorer to design UX (use premium-ux-designer)
- Ask premium-ux-designer to explain protocol mechanics (use pond0x-mechanics-analyst)
- Overload one agent with multiple unrelated tasks
- Skip the review step (always use comprehensive-code-reviewer before committing)

---

## 🎓 Learning Path

**Beginner**:
1. Start with single-agent tasks (e.g., code-refactorer)
2. Get comfortable with @ syntax
3. Try 2-agent workflows

**Intermediate**:
1. Use full feature workflows (4-5 agents)
2. Customize agent prompts
3. Create your own agents

**Advanced**:
1. Design custom multi-agent pipelines
2. Optimize for your specific workflow
3. Contribute agent improvements

---

## 📖 Related Documentation

- [Claude Code Agents Documentation](https://code.claude.com/docs/en/agents)
- [Project README](./README.md)
- [Pond0x Protocol Plan](../../docs/POND0X_PROJECT_PLAN.md)
- [Polyrepo Setup Guide](../../docs/POLYREPO_SETUP_GUIDE.md)

---

**Pro Tip**: Bookmark this guide and reference it when planning new features. The multi-agent approach significantly improves code quality and development speed!

Happy building! 🌊
