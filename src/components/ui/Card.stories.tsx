import type { Meta, StoryObj } from '@storybook/react';
import { FileJson, Download } from 'lucide-react';

import { Button } from './Button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';

/**
 * The Card component provides a flexible container for grouping related content.
 * It includes several sub-components for structured layout: Header, Title, Description, Content, and Footer.
 */
const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic card with just content
 */
export const Basic: Story = {
  render: () => (
    <Card>
      <CardContent className="pt-6">
        <p>This is a basic card with simple content.</p>
      </CardContent>
    </Card>
  ),
};

/**
 * Card with header and title
 */
export const WithHeader: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Card content goes here. This is a typical card layout with a header.</p>
      </CardContent>
    </Card>
  ),
};

/**
 * Complete card with all sections
 */
export const Complete: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>JSON File Upload</CardTitle>
        <CardDescription>
          Upload your JSON file to visualize and analyze its structure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center space-y-4 text-center py-8">
          <div className="rounded-full bg-primary/10 p-4">
            <FileJson className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            Drag and drop your file here or click to browse
          </p>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <p className="text-xs text-muted-foreground">Max size: 50MB</p>
        <Button size="sm">
          <Download className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * Card with footer buttons
 */
export const WithFooter: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Confirmation</CardTitle>
        <CardDescription>Are you sure you want to proceed?</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          This action cannot be undone. This will permanently delete your data.
        </p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button variant="destructive">Delete</Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * Card as a feature showcase
 */
export const Feature: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3">
            <FileJson className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">JSON Visualization</CardTitle>
            <CardDescription>Multiple view modes available</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center">
            <span className="mr-2">•</span>
            Tree view for hierarchical data
          </li>
          <li className="flex items-center">
            <span className="mr-2">•</span>
            Graph view for relationships
          </li>
          <li className="flex items-center">
            <span className="mr-2">•</span>
            Table view for tabular data
          </li>
          <li className="flex items-center">
            <span className="mr-2">•</span>
            Raw editor for direct editing
          </li>
        </ul>
      </CardContent>
    </Card>
  ),
};

/**
 * Multiple cards in a grid layout
 */
export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4" style={{ width: '800px' }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload File</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Drop your JSON file here
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paste JSON</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Paste your JSON text directly
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fetch from URL</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Load JSON from a remote URL
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Files</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">View your history</p>
        </CardContent>
      </Card>
    </div>
  ),
};

/**
 * Interactive card with hover effect
 */
export const Interactive: Story = {
  render: () => (
    <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
      <CardHeader>
        <CardTitle>Clickable Card</CardTitle>
        <CardDescription>This card has interactive hover effects</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          Hover over this card to see the elevation and scale effects.
        </p>
      </CardContent>
    </Card>
  ),
};
