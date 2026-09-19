import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  // Internal state
  isExpanded?: boolean;
}

interface FileTreeProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  onFileCreate: (path: string, type: 'file' | 'folder') => void;
  onFileDelete: (fileId: string) => void;
  onFileRename: (fileId: string, newName: string) => void;
  activeFileId?: string;
}

interface FileTreeItemProps {
  node: FileNode;
  level: number;
  onSelect: (file: FileNode) => void;
  onFileCreate: (path: string, type: 'file' | 'folder') => void;
  onDelete: (fileId: string) => void;
  onRename: (fileId: string, newName: string) => void;
  activeFileId?: string;
}

const getFileIcon = (fileName: string, isFolder: boolean, isExpanded: boolean) => {
  if (isFolder) {
    return isExpanded ? 'folder-open-outline' : 'folder-outline';
  }
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'cpp': case 'cc': case 'cxx': return 'logo-codepen';
    case 'c': return 'code';
    case 'h': case 'hpp': case 'hxx': return 'document-text-outline';
    case 'js': return 'logo-javascript';
    case 'ts': return 'logo-typescript';
    case 'py': return 'logo-python';
    case 'json': return 'document-outline';
    case 'md': return 'document-text-outline';
    default: return 'document-outline';
  }
};

const FileTreeItem: React.FC<FileTreeItemProps> = ({ node, level, onSelect, onFileCreate, onDelete, onRename, activeFileId }) => {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(node.isExpanded ?? true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name);

  const handleToggle = () => {
    if (node.type === 'folder') {
      setIsExpanded(!isExpanded);
    } else {
      onSelect(node);
    }
  };
  
  const handleRename = () => {
    if (newName && newName !== node.name) {
      onRename(node.id, newName);
    }
    setIsRenaming(false);
  };

  const isActive = activeFileId === node.id;

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.fileItem,
          { 
            paddingLeft: 16 + level * 20,
            backgroundColor: isActive ? colors.primary + '20' : 'transparent',
          },
        ]}
        onPress={handleToggle}
        onLongPress={() => setIsRenaming(true)}
      >
        <Ionicons
          name={getFileIcon(node.name, node.type === 'folder', isExpanded)}
          size={18}
          color={node.type === 'folder' ? colors.primary : colors.textSecondary}
          style={styles.fileIcon}
        />
        {isRenaming ? (
          <TextInput
            style={[styles.fileName, { color: colors.text }]}
            value={newName}
            onChangeText={setNewName}
            onBlur={handleRename}
            onSubmitEditing={handleRename}
            autoFocus
          />
        ) : (
          <Text style={[styles.fileName, { color: isActive ? colors.primary : colors.text }]} numberOfLines={1}>
            {node.name}
          </Text>
        )}
      </TouchableOpacity>

      {node.type === 'folder' && isExpanded && node.children && (
        <View>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              onFileCreate={onFileCreate}
              onDelete={onDelete}
              onRename={onRename}
              activeFileId={activeFileId}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({ files, onFileSelect, onFileCreate, onFileDelete, onFileRename, activeFileId }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {files.map((node) => (
          <FileTreeItem
            key={node.id}
            node={node}
            level={0}
            onSelect={onFileSelect}
            onFileCreate={onFileCreate}
            onDelete={onFileDelete}
            onRename={onFileRename}
            activeFileId={activeFileId}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 16,
  },
  fileIcon: {
    marginRight: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
  },
}); 