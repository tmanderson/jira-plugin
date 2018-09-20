import * as path from 'path';
import { STATUS_ICONS } from './constants';
import state from '../state/state';
import { Jira } from '../http/api';

// generate icon + status
export const addStatusIcon = (status: string, withDescription: boolean): string => {
  let icon = STATUS_ICONS.DEFAULT.icon;
  if (!!status) {
    Object.values(STATUS_ICONS).forEach(value => {
      if (status.toUpperCase().indexOf(value.text.toUpperCase()) !== -1) {
        icon = value.icon;
      }
    });
  }
  return `${icon}` + (withDescription ? `  ${status} ` : ``);
};

export const getIconsPath = (fileName: string): string => {
  return path.join(__filename, '..', '..', '..', '..', 'images', 'icons', fileName);
};

export const secondsToHHMMSS = (sec: number): string => {
  let hours = Math.floor(sec / 3600);
  let minutes = Math.floor((sec - hours * 3600) / 60);
  let seconds = sec - hours * 3600 - minutes * 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const secondsToMinutes = (sec: number): number => {
  return Math.floor(sec / 60);
};

/**
 * Because Atlassian refuses to use markdown, this accounts for some of their
 * _dreadful_ formatting syntax.
 * 
 * @param description - Jira ticket description
 */
export const atlassianMarkupToHtml = (description: string | undefined): string => {
  if (typeof description !== 'string') {
    return '';
  }

  const styles: [RegExp, (match: RegExpExecArray) => string, boolean?][] = [
    [
      /[\t\s]*h(\d)\.\s*([^\n]+)/g,
      (m) => `\n<h${m[1]}>${m[2]}</h${m[1]}>\n`
    ],
    [
      /\b\*(.+?)\*\b/g,
      (m) => `<strong>${m[1]}</strong>`
    ],
    [
      /\b\_(.+?)\_\b/g,
      (m) => `<emphasis>${m[1]}</emphasis>`
    ],
    [
      /\b\-(.+?)-\b/g,
      (m) => `<span style="text-decoration:line-through;">${m[1]}</span>`
    ],
    [
      /[\t\s]*(#)[*\s]*(.+)/g,
      (m) => `\n<li>${m[2]}</li>\n`,
      false
    ],
    [
      /[\t\s]*(\*)[\#\s]*(.+)/g,
      (m) => `\n<li>${m[2]}</li>\n`,
      false
    ]
  ];
  
  return styles.reduce((description: string, style, i) => {
    const p:RegExp = style[0];
    const formatter = style[1];
    let match:RegExpExecArray|null;
    let lastOffset:[number, string] = [0, ''];

    while((match = p.exec(description))) {
      let formattedString = formatter(match);

      if (style[2] === false) {
        formattedString = match[1].charAt(0) === '#'
          ? `\n<ol>${formattedString}`
          : `\n<ul>${formattedString}`;
        
        style[2] = true;
      }

      description = `${description.substring(0, match.index || 0)}${formatter(match)}${description.substring((match.index || 0) + match[0].length)}`;
      lastOffset = [(match.index || 0) + formattedString.length, match[1].charAt(0)];
    }

    if (lastOffset[0] && style[2] === true) {
      const listType = lastOffset[1] === '#' ? '</ol>' : '</ul>';
      description = `${description.substring(0, lastOffset[0])}${listType}${description.substring(lastOffset[0])}`;
      style[2] = false;
    }
    
    return description;
  }, description);
};