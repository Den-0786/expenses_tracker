import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  TextInput as RNTextInput,
} from "react-native";
import {
  Card,
  Title,
  Button,
  FAB,
  Portal,
  Modal,
  TextInput,
  Searchbar,
} from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns";
import Toast from "react-native-toast-message";
import { useTheme } from "../context/ThemeContext";
import { useDatabase } from "../context/DatabaseContext";

const NotesScreen = () => {
  const { theme } = useTheme();
  const { getNotes, saveNote, updateNote, deleteNote } = useDatabase();
  const scrollViewRef = useRef(null);

  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  // Form states
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [bodyWithNumbers, setBodyWithNumbers] = useState("");
  const [noteStructure, setNoteStructure] = useState([]);

  // Track expanded notes
  const [expandedNotes, setExpandedNotes] = useState(new Set());

  // Delete confirmation modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [notes, searchQuery]);

  const loadNotes = async () => {
    try {
      const notesData = await getNotes();
      setNotes(notesData || []);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load notes",
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  };

  const filterNotes = () => {
    if (!searchQuery.trim()) {
      setFilteredNotes(notes);
      return;
    }

    const filtered = notes.filter(
      (note) =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.body.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredNotes(filtered);
  };

  const handleAddNote = async () => {
    if (!title.trim() || !bodyWithNumbers.trim()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please fill in both title and body",
      });
      return;
    }

    try {
      const newNote = {
        title: title.trim(),
        body: bodyWithNumbers.trim(),
        created_at: new Date().toISOString(),
      };

      await saveNote(newNote);
      setAddModalVisible(false);
      resetForm();
      loadNotes();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Note saved successfully",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save note",
      });
    }
  };

  const handleEditNote = async () => {
    if (!title.trim() || !bodyWithNumbers.trim()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please fill in both title and body",
      });
      return;
    }

    try {
      const updatedNote = {
        ...selectedNote,
        title: title.trim(),
        body: bodyWithNumbers.trim(),
        updated_at: new Date().toISOString(),
      };

      await updateNote(updatedNote);
      setEditModalVisible(false);
      setSelectedNote(null);
      resetForm();
      loadNotes();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Note updated successfully",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update note",
      });
    }
  };

  const handleDeleteNote = async (noteId) => {
    setNoteToDelete(noteId);
    setDeleteModalVisible(true);
  };

  const deleteNoteConfirmed = async (noteId) => {
    try {
      await deleteNote(noteId);
      setNoteToDelete(null);
      loadNotes();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Note deleted successfully",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete note",
      });
    }
  };

  const openEditModal = (note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setBody(note.body);
    setBodyWithNumbers(note.body);
    setEditModalVisible(true);
  };

  const resetForm = () => {
    setTitle("");
    setBody("");
    setBodyWithNumbers("");
    setNoteStructure([]);
  };

  const formatBodyWithNumbers = (bodyText) => {
    if (!bodyText) return "";
    const lines = bodyText.split("\n");
    return lines
      .map((line, index) => {
        // If line already starts with a number and period, don't add another
        if (/^\d+\.\s*/.test(line.trim())) {
          return line;
        }
        // If line is empty, don't add numbering
        if (!line.trim()) {
          return line;
        }
        // Add numbering only to lines that don't have it
        return `${index + 1}. ${line}`;
      })
      .join("\n");
  };

  const handleBodyFocus = () => {
    if (!body.trim()) {
      setBody("1. ");
      setBodyWithNumbers("1. ");
      setNoteStructure([{ id: 1, text: "1. ", level: 0, hasSubItems: false }]);
    }
  };

  const toRomanNumeral = (num) => {
    const romanNumerals = [
      { value: 1000, numeral: "M" },
      { value: 900, numeral: "CM" },
      { value: 500, numeral: "D" },
      { value: 400, numeral: "CD" },
      { value: 100, numeral: "C" },
      { value: 90, numeral: "XC" },
      { value: 50, numeral: "L" },
      { value: 40, numeral: "XL" },
      { value: 10, numeral: "X" },
      { value: 9, numeral: "IX" },
      { value: 5, numeral: "V" },
      { value: 4, numeral: "IV" },
      { value: 1, numeral: "I" },
    ];

    let result = "";
    for (let i = 0; i < romanNumerals.length; i++) {
      while (num >= romanNumerals[i].value) {
        result += romanNumerals[i].numeral;
        num -= romanNumerals[i].value;
      }
    }
    return result.toLowerCase();
  };

  // Add sub-item to a main point
  const addSubItem = (mainItemId) => {
    const mainItem = noteStructure.find((item) => item.id === mainItemId);
    if (mainItem) {
      const subItems = noteStructure.filter(
        (item) => item.parentId === mainItemId
      );
      const newSubItem = {
        id: Date.now(),
        text: "",
        level: 1,
        parentId: mainItemId,
        order: subItems.length + 1,
      };

      setNoteStructure((prev) => [...prev, newSubItem]);
      mainItem.hasSubItems = true;

      setNoteStructure((prev) =>
        prev.map((item) =>
          item.id === mainItemId ? { ...item, hasSubItems: true } : item
        )
      );
    }
  };

  const handleDoubleTap = (itemId, currentLevel) => {
    if (currentLevel === 1) {
      const mainItem = noteStructure.find(
        (item) => item.id === itemId
      )?.parentId;
      if (mainItem) {
        const mainItemElement = noteStructure.find(
          (item) => item.id === mainItem
        );
        if (mainItemElement) {
          Toast.show({
            type: "info",
            text1: "Navigation",
            text2: "Moved to main section",
          });
        }
      }
    }
  };

  const handleBodyChange = (text) => {
    setBody(text);
    setBodyWithNumbers(text);

    // Only process actual line breaks (Enter key), not word wrapping
    const actualLines = text.split("\n");
    const hasActualContent = actualLines.some((line) => {
      const trimmed = line.trim();
      return trimmed && !/^\d+\.\s*$/.test(trimmed);
    });
    const allLinesAreJustNumbers = actualLines.every((line) => {
      const trimmed = line.trim();
      return !trimmed || /^\d+\.\s*$/.test(trimmed);
    });

    if (!hasActualContent || allLinesAreJustNumbers) {
      setBodyWithNumbers("");
      setNoteStructure([]);
      return;
    }

    // Process only actual line breaks, not word-wrapped text
    const numberedLines = actualLines.map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        return line;
      }
      if (line.startsWith("  ") || line.startsWith("0")) {
        return line;
      }
      if (/^\d+\.\s*$/.test(trimmedLine)) {
        return line;
      }
      if (/^\d+\./.test(trimmedLine)) {
        return line;
      }
      if (trimmedLine && !/^\d+/.test(trimmedLine)) {
        return `${index + 1}. ${trimmedLine}`;
      }

      return line;
    });

    const numberedText = numberedLines.join("\n");
    setBodyWithNumbers(numberedText);

    // Only create structure for actual line breaks
    const newStructure = [];
    let mainItemCounter = 0;
    let currentMainItem = null;

    numberedLines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (trimmedLine) {
        if (/^\d+\./.test(trimmedLine)) {
          mainItemCounter++;
          currentMainItem = {
            id: mainItemCounter,
            text: trimmedLine,
            level: 0,
            hasSubItems: false,
            lineIndex: index,
          };
          newStructure.push(currentMainItem);
        } else if (
          line.startsWith("  ") ||
          /^[ivxlcdm]+\./i.test(trimmedLine)
        ) {
          if (currentMainItem) {
            const subItem = {
              id: Date.now() + index,
              text: trimmedLine,
              level: 1,
              parentId: currentMainItem.id,
              order:
                newStructure.filter(
                  (item) => item.parentId === currentMainItem.id
                ).length + 1,
              lineIndex: index,
            };
            newStructure.push(subItem);
            currentMainItem.hasSubItems = true;
          }
        }
      }
    });

    setNoteStructure(newStructure);
  };

  // Handle key press to add automatic numbering on new lines
  const handleKeyPress = (e) => {
    if (e.nativeEvent.key === "Enter") {
      const lines = bodyWithNumbers.split("\n");
      const currentLineIndex = lines.length - 1;
      const nextLineNumber = currentLineIndex + 1;
      const newText = bodyWithNumbers + `\n${nextLineNumber}. `;
      setBodyWithNumbers(newText);

      handleBodyChange(newText);
      const lineCount = lines.length + 1;

      if (lineCount >= 8) {
        const linesToHide = lineCount - 7;
        const scrollOffset = linesToHide * 28;
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
              y: scrollOffset,
              animated: true,
            });
          }
        }, 50);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.nativeEvent.key === "Backspace") {
      const lines = bodyWithNumbers.split("\n");
      const currentLine = lines[lines.length - 1];

      if (currentLine && /^\d+\.\s*$/.test(currentLine)) {
        const newLines = lines.slice(0, -1);
        const newText = newLines.join("\n");
        setBodyWithNumbers(newText);
        handleBodyChange(newText);
      }
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy");
    } catch (error) {
      return "Invalid Date";
    }
  };

  const toggleNoteExpansion = (noteId) => {
    setExpandedNotes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const renderNote = (note) => {
    return (
      <Card key={note.id} style={styles.noteCard}>
        <Card.Content>
          <View style={styles.noteHeader}>
            <View style={styles.noteTitleContainer}>
              <Title style={[styles.noteTitle, { color: theme.colors.text }]}>
                {note.title}
              </Title>
              <Text
                style={[styles.noteDate, { color: theme.colors.textSecondary }]}
              >
                {formatDate(note.created_at)}
              </Text>
            </View>
            <View style={styles.noteActions}>
              <TouchableOpacity
                onPress={() => openEditModal(note)}
                style={styles.actionButton}
              >
                <MaterialIcons
                  name="edit"
                  size={20}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteNote(note.id)}
                style={styles.actionButton}
              >
                <MaterialIcons
                  name="delete"
                  size={20}
                  color={theme.colors.error}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.noteBodyContainer}>
            <Text style={[styles.noteBody, { color: theme.colors.text }]}>
              {formatBodyWithNumbers(note.body)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderHierarchicalNote = (note) => {
    const isExpanded = expandedNotes.has(note.id);
    const noteLines = note.body.split("\n").filter((line) => line.trim());
    const hasMoreContent = noteLines.length > 1;

    return (
      <Card key={note.id} style={styles.noteCard}>
        <Card.Content>
          <TouchableOpacity
            onPress={() => toggleNoteExpansion(note.id)}
            activeOpacity={0.7}
            style={styles.noteHeaderTouchable}
          >
            <View style={styles.noteHeader}>
              <View style={styles.noteTitleContainer}>
                <Title style={[styles.noteTitle, { color: theme.colors.text }]}>
                  {note.title}
                </Title>
                <Text
                  style={[
                    styles.noteDate,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {formatDate(note.created_at)}
                </Text>
              </View>
              <View style={styles.noteActions}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    openEditModal(note);
                  }}
                  style={styles.actionButton}
                >
                  <MaterialIcons
                    name="edit"
                    size={20}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(note.id);
                  }}
                  style={styles.actionButton}
                >
                  <MaterialIcons
                    name="delete"
                    size={20}
                    color={theme.colors.error}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Expand/Collapse indicator */}
            <View style={styles.notePreviewContainer}>
              <View style={styles.expandIndicator}>
                <MaterialIcons
                  name={isExpanded ? "expand-less" : "expand-more"}
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
            </View>
          </TouchableOpacity>

          {/* Expanded content */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              <View style={styles.noteBodyContainer}>
                <Text style={[styles.noteBody, { color: theme.colors.text }]}>
                  {formatBodyWithNumbers(note.body)}
                </Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <LinearGradient colors={["#4CAF50", "#2196F3"]} style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notes</Text>
        <Text style={styles.headerSubtitle}>
          Keep track of your thoughts and ideas
        </Text>
      </View>

      {/* Main Content Container - Gray Parent Card */}
      <View style={styles.contentContainer}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search notes..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor="#666"
            inputStyle={{ color: "#333" }}
          />
        </View>

        {/* Scrollable Notes List */}
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredNotes.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="note-add" size={64} color="#ccc" />
              <Text style={styles.emptyStateText}>
                {searchQuery ? "No notes match your search" : "No notes yet"}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery
                  ? "Try adjusting your search"
                  : "Tap the + button to create your first note"}
              </Text>
            </View>
          ) : (
            <View style={styles.notesList}>
              {filteredNotes.map(renderHierarchicalNote)}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Add Note Modal */}
      <Portal>
        <Modal
          visible={addModalVisible}
          onDismiss={() => setAddModalVisible(false)}
          dismissable={false}
          contentContainerStyle={styles.addNoteModal}
        >
          <View style={styles.addNoteContainer}>
            {/* Sticky Header */}
            <View style={styles.addNoteHeader}>
              <TouchableOpacity
                style={styles.addNoteHeaderButton}
                onPress={() => {
                  setAddModalVisible(false);
                  resetForm();
                }}
              >
                <MaterialIcons name="close" size={24} color="#4B5563" />
                <Text style={styles.addNoteButtonText}>Cancel</Text>
              </TouchableOpacity>

              <View style={styles.addNoteHeaderIcons}>
                <TouchableOpacity style={styles.addNoteIconButton}>
                  <MaterialIcons
                    name="content-copy"
                    size={22}
                    color="#4B5563"
                  />
                </TouchableOpacity>

                <TouchableOpacity style={styles.addNoteIconButton}>
                  <MaterialIcons name="edit" size={22} color="#4B5563" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.addNoteSaveButton}
                  onPress={handleAddNote}
                >
                  <Text style={styles.addNoteSaveButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Note Title Input */}
            <RNTextInput
              style={[styles.addNoteModalInput, styles.addNoteTitleInput]}
              placeholder="Title"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />

            {/* Note Body Input - Takes full screen */}

            <ScrollView
              style={styles.addNoteBodyInputContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ref={scrollViewRef}
              scrollEventThrottle={16}
              nestedScrollEnabled={true}
              onScroll={() => {}}
            >
              <RNTextInput
                style={[styles.addNoteModalInput, styles.addNoteBodyInput]}
                placeholder="Start typing your note here..."
                placeholderTextColor="#9CA3AF"
                value={bodyWithNumbers}
                onChangeText={handleBodyChange}
                onFocus={handleBodyFocus}
                onKeyPress={handleKeyPress}
                onKeyDown={handleKeyDown}
                multiline={true}
                textAlignVertical="top"
                scrollEnabled={false}
                textAlign="left"
                autoCapitalize="sentences"
                autoCorrect={false}
                spellCheck={false}
                textBreakStrategy="simple"
                dataDetectorTypes="none"
              />
            </ScrollView>
          </View>
        </Modal>
      </Portal>

      {/* Edit Note Modal */}
      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          dismissable={false}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <ScrollView
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              label="Title"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={[
                styles.modalInput,
                styles.titleInput,
                { backgroundColor: theme.colors.surface },
              ]}
              textColor={theme.colors.text}
              labelStyle={{
                color: theme.colors.textSecondary,
                fontWeight: "bold",
              }}
              outlineColor={theme.colors.border}
              activeOutlineColor={theme.colors.primary}
            />

            <View style={styles.noteBodyInputContainer}>
              <TextInput
                label="Note Body"
                value={bodyWithNumbers}
                onChangeText={handleBodyChange}
                onFocus={handleBodyFocus}
                onKeyPress={handleKeyPress}
                onKeyDown={handleKeyDown}
                mode="outlined"
                multiline
                numberOfLines={12}
                style={[
                  styles.modalInput,
                  styles.noteBodyInput,
                  { backgroundColor: theme.colors.surface },
                ]}
                textColor={theme.colors.text}
                labelStyle={{ color: theme.colors.textSecondary }}
                outlineColor={theme.colors.border}
                activeOutlineColor={theme.colors.primary}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setEditModalVisible(false)}
              style={styles.modalButton}
              textColor={theme.colors.primary}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleEditNote}
              style={styles.modalButton}
              buttonColor={theme.colors.primary}
            >
              Update
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Delete Confirmation Modal */}
      <Portal>
        <Modal
          visible={deleteModalVisible}
          onDismiss={() => setDeleteModalVisible(false)}
          dismissable={true}
          contentContainerStyle={[
            styles.deleteModal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.deleteModalContent}>
            <MaterialIcons
              name="delete-outline"
              size={48}
              color={theme.colors.error}
              style={styles.deleteModalIcon}
            />
            <Title
              style={[styles.deleteModalTitle, { color: theme.colors.text }]}
            >
              Delete Note
            </Title>
            <Text
              style={[
                styles.deleteModalText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Are you sure you want to delete this note? This action cannot be
              undone.
            </Text>

            <View style={styles.deleteModalActions}>
              <Button
                mode="outlined"
                onPress={() => setDeleteModalVisible(false)}
                style={styles.deleteModalButton}
                textColor={theme.colors.primary}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  setDeleteModalVisible(false);
                  deleteNoteConfirmed(noteToDelete);
                }}
                style={[styles.deleteModalButton, styles.deleteConfirmButton]}
                buttonColor={theme.colors.error}
              >
                Delete
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setAddModalVisible(true)}
        color={theme.colors.onPrimary}
      />

      {/* Toast Component */}
      <Toast />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "transparent",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#ffffff",
    opacity: 0.9,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginTop: -20,
    marginHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  searchContainer: {
    backgroundColor: "#ffffff",
    padding: 15,
    margin: 10,
    marginBottom: 20,
    borderRadius: 12,
    elevation: 2,
  },
  searchBar: {
    elevation: 2,
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  notesList: {
    paddingHorizontal: 10,
  },
  noteCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 8,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  noteTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  noteDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  noteActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  noteBodyContainer: {
    marginTop: 5,
  },
  noteBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  mainItemContainer: {
    marginBottom: 16,
  },
  mainItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  mainItemText: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  addSubItemButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.3)",
  },
  subItemContainer: {
    marginLeft: 24,
    marginBottom: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderRadius: 6,
  },
  subItemText: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
  },
  modal: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 16,
    maxHeight: "90%",
    position: "relative",
    bottom: "8",
  },
  modalScrollView: {
    maxHeight: 200,
  },
  modalInput: {
    marginBottom: 15,
    borderRadius: 12,
  },
  titleInput: {
    fontWeight: "bold",
  },
  noteBodyInput: {
    minHeight: 300,
    textAlignVertical: "top",
    lineHeight: 20,
  },
  noteBodyInputContainer: {
    position: "relative",
  },
  inlineAddButton: {
    position: "absolute",
    right: 10,
    padding: 8,
    borderRadius: 16,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.3)",
    zIndex: 1,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
    marginTop: 15,
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "white",
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 2,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },

  // Add Note Modal Styles
  addNoteModal: {
    backgroundColor: "white",
    margin: 0,
    flex: 1,
    width: "100%",
    height: "100%",
  },
  addNoteContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    width: "100%",
    height: "100%",
  },
  addNoteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    // Enhanced shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    // Enhanced elevation for Android
    elevation: 8,
    zIndex: 10,
  },
  addNoteHeaderButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  addNoteButtonText: {
    marginLeft: 6,
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  addNoteHeaderIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addNoteIconButton: {
    padding: 10,
    marginHorizontal: 2,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  addNoteSaveButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addNoteSaveButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  addNoteModalInput: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  addNoteTitleInput: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
    borderColor: "#E5E7EB",
    borderBottomWidth: 2,
    borderRadius: 0,
    paddingBottom: 12,
  },
  addNoteBodyInputContainer: {
    flex: 1,
    minHeight: Dimensions.get("window").height - 60,
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 8,
  },
  addNoteBodyInput: {
    fontSize: 18,
    color: "#374151",
    flex: 1,
    textAlignVertical: "top",
    minHeight: Dimensions.get("window").height - 100,
    lineHeight: 26,
    paddingTop: 16,
    paddingBottom: 20,
    textAlign: "left",
    flexWrap: "wrap",
    wordWrap: "break-word",
    paddingLeft: 32,
    textIndent: 16,
  },
  addNoteInlineAddButton: {
    position: "absolute",
    right: 26,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  // Expandable note styles
  noteHeaderTouchable: {
    width: "100%",
  },
  notePreviewContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  expandIndicator: {
    alignItems: "center",
    justifyContent: "center",
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  // Delete confirmation modal styles
  deleteModal: {
    backgroundColor: "white",
    padding: 24,
    margin: 40,
    borderRadius: 16,
    maxWidth: "90%",
    alignSelf: "center",
  },
  deleteModalContent: {
    alignItems: "center",
  },
  deleteModalIcon: {
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  deleteModalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  deleteModalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    width: "100%",
  },
  deleteModalButton: {
    flex: 1,
    borderRadius: 12,
  },
  deleteConfirmButton: {
    borderWidth: 0,
  },

  numberDivider: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "#E5E7EB",
    opacity: 0.6,
  },
});

export default NotesScreen;
