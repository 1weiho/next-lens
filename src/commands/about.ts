import { Command } from "commander";

const aboutText = `next-lens

A utility for exploring Next.js App Router API route handlers. Use \`api:list\`
 to inspect the routes in your project and quickly review exported HTTP
 handlers across your application.`;

export const aboutCommand = new Command("about")
  .description("Show information about the next-lens CLI.")
  .action(() => {
    console.log(aboutText);
  });

export default aboutCommand;
