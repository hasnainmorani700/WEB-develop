import React from 'react';

export type AiProvider = 'gemini' | 'deepseek' | 'chatgpt';

export enum ComponentType {
  Container = 'Container',
  Text = 'Text',
  Button = 'Button',
  Image = 'Image',
  Dropdown = 'Dropdown',
  Input = 'Input',
  Textarea = 'Textarea',
  Video = 'Video',
  Divider = 'Divider',
  Card = 'Card',
  Icon = 'Icon',
  ProgressBar = 'ProgressBar',
  Alert = 'Alert',
  Accordion = 'Accordion',
  Tabs = 'Tabs',
  // New components start here
  Navbar = 'Navbar',
  Footer = 'Footer',
  Form = 'Form',
  Label = 'Label',
  Checkbox = 'Checkbox',
  Radio = 'Radio',
  Select = 'Select',
  Map = 'Map',
  SocialIcons = 'SocialIcons',
  Table = 'Table',
  List = 'List',
  Blockquote = 'Blockquote',
  Spinner = 'Spinner',
  Rating = 'Rating',
  Carousel = 'Carousel',
  Fieldset = 'Fieldset',
}

export interface ComponentStyles {
  // Positioning
  top: string;
  left: string;
  zIndex: string;
  // Spacing
  padding: string;
  margin: string;
  // Sizing
  width: string;
  height: string;
  minHeight: string;
  // Colors
  backgroundColor: string;
  textColor: string;
  barColor?: string;
  // Text
  fontSize: string;
  fontWeight: string;
  textDecoration?: string;
  // Border
  border: string;
  borderColor: string;
  borderRadius: string;
  // Effects
  boxShadow: string;
}

export interface DropdownOption {
  id: string;
  label: string;
  url: string;
}

export interface AccordionItem {
    id: string;
    title: string;
    content: string;
}

export interface Tab {
    id: string;
    title: string;
}

export interface NavLink {
    id: string;
    text: string;
    url: string;
}

export interface SocialLink {
    id: string;
    network: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'github';
    url: string;
}

export interface CarouselImage {
    id: string;
    src: string;
    alt: string;
}

export interface ViewportStyles {
  base: Partial<ComponentStyles>;
  hover?: Partial<ComponentStyles>;
}

export interface PageComponent {
  id: string;
  type: ComponentType;
  name: string;
  stylesByViewport: {
    [viewportName: string]: ViewportStyles;
  };
  content: {
    text?: string;
    htmlFor?: string;
    checked?: boolean;
    imageUrl?: string;
    buttonText?: string;
    dropdownOptions?: DropdownOption[];
    selectOptions?: string; // Comma-separated
    placeholder?: string;
    videoUrl?: string;
    mapQuery?: string;
    iconName?: string;
    progress?: number;
    alertText?: string;
    alertType?: 'Info' | 'Success' | 'Warning' | 'Error';
    accordionItems?: AccordionItem[];
    tabs?: Tab[];
    activeTab?: number;
    navLinks?: NavLink[];
    socialLinks?: SocialLink[];
    tableData?: string; // CSV format
    listItems?: string; // Newline-separated
    listType?: 'ordered' | 'unordered';
    quote?: string;
    cite?: string;
    rating?: number;
    maxRating?: number;
    carouselImages?: CarouselImage[];
    // Form attributes
    formAction?: string;
    formMethod?: 'GET' | 'POST';
    formEnctype?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain';
    // Input attributes
    inputType?: 'text' | 'password' | 'email' | 'number' | 'date' | 'file';
    inputName?: string;
    isRequired?: boolean;
    autocomplete?: 'on' | 'off';
    // Fieldset content
    legendText?: string;
  };
  children: PageComponent[];
  linkUrl?: string;
  events?: {
    onclick?: string;
    onmouseover?: string;
  };
}

export interface Page {
  id: string;
  name: string;
  seoTitle?: string;
  seoDescription?: string;
  customJs?: string;
  customHeadContent?: string;
}

export interface ThemeStyles {
    fontFamily: string;
    bodyBackground: string;
    bodyColor: string;
}

export interface ProjectSettings {
  globalJs?: string;
  globalHeadContent?: string;
}

export interface Viewport {
  name: string;
  width: number;
  height: number;
  breakpoint: number;
  icon: React.ReactElement;
}