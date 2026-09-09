import React, { useState } from 'react';
import { ThumbsUpIcon, MessageSquareIcon, RepeatIcon, SendIcon } from './Icons';

interface LinkedInCardPreviewProps {
  text: string;
  charCount: number;
}

export function LinkedInCardPreview({ text, charCount }: LinkedInCardPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const cutoffLimit = 210;
  const isTruncated = charCount > cutoffLimit;

  // Render text with feed cutoff simulation
  const displayText = (!expanded && isTruncated)
    ? text.slice(0, cutoffLimit)
    : text;

  return (
    <div className="feed-card-wrapper">
      <div className="feed-card-header-bar">
        <span className="feed-preview-badge">Live Feed Simulation</span>
        {isTruncated && (
          <button
            type="button"
            className="toggle-fold-button"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show Fold Line' : 'Simulate Feed Cutoff'}
          </button>
        )}
      </div>

      <div className="linkedin-card">
        {/* Author Header */}
        <div className="linkedin-author">
          <div className="linkedin-avatar">
            <span>IN</span>
            <div className="linkedin-avatar-badge" />
          </div>
          <div className="linkedin-meta">
            <div className="linkedin-name-row">
              <span className="linkedin-author-name">Your Name</span>
              <span className="linkedin-author-degree">• 1st</span>
            </div>
            <p className="linkedin-author-headline">Founder & Growth Strategist • Top Voice</p>
            <p className="linkedin-post-time">1h • Edited • 🌐</p>
          </div>
        </div>

        {/* Post Body */}
        <div className="linkedin-content">
          <div className="linkedin-text-body">
            {displayText || <span className="empty-placeholder">Start writing to see your post preview here...</span>}
            {!expanded && isTruncated && (
              <span
                role="button"
                tabIndex={0}
                className="see-more-link"
                onClick={() => setExpanded(true)}
                onKeyDown={(e) => e.key === 'Enter' && setExpanded(true)}
              >
                {' '}…see more
              </span>
            )}
          </div>

          {/* Cutoff Marker Notice */}
          {isTruncated && (
            <div className={`fold-indicator-box ${expanded ? 'expanded' : 'collapsed'}`}>
              <div className="fold-line" />
              <span className="fold-tag">
                {expanded ? '▲ Past the 210-character mobile fold' : '▼ Mobile cutoff boundary (~210 chars)'}
              </span>
            </div>
          )}
        </div>

        {/* Reaction Counts */}
        <div className="linkedin-stats-bar">
          <div className="reactions-icons">
            <span className="reaction-bubble blue">👍</span>
            <span className="reaction-bubble red">❤️</span>
            <span className="reaction-bubble amber">💡</span>
            <span className="reaction-count">142</span>
          </div>
          <div className="comments-count">
            <span>28 comments</span>
            <span>•</span>
            <span>7 reposts</span>
          </div>
        </div>

        {/* Feed Actions Bar */}
        <div className="linkedin-actions-bar">
          <button type="button" className="linkedin-action-btn">
            <ThumbsUpIcon size={16} />
            <span>Like</span>
          </button>
          <button type="button" className="linkedin-action-btn">
            <MessageSquareIcon size={16} />
            <span>Comment</span>
          </button>
          <button type="button" className="linkedin-action-btn">
            <RepeatIcon size={16} />
            <span>Repost</span>
          </button>
          <button type="button" className="linkedin-action-btn">
            <SendIcon size={16} />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
