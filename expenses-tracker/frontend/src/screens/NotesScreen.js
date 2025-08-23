import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from "react-native";
import {
  Card,
  Title,
  Button,
  FAB,
  Portal,
  Modal,
  TextInput,
  Chip,
  Searchbar,
} from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns";
import Toast from "react-native-toast-message";
import { useTheme } from "../context/ThemeContext";
import { useDatabase } from "../context/DatabaseContext";

const { width } = Dimensions.get("window");

const NotesScreen = () => {
  const { theme } = useTheme();
  const { getNotes, saveNote, updateNote, deleteNote } = useDatabase();

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
    if (!title.trim() || !body.trim()) {
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
        body: body.trim(),
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
    if (!title.trim() || !body.trim()) {
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
        body: body.trim(),
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
    Toast.show({
      type: "info",
      text1: "Confirm Delete",
      text2: "Are you sure you want to delete this note?",
      position: "center",
      visibilityTime: 0,
      autoHide: false,
      topOffset: 100,
      onPress: () => {
        Toast.hide();
        deleteNoteConfirmed(noteId);
      },
      props: {
        onPress: () => {
          Toast.hide();
          deleteNoteConfirmed(noteId);
        },
      },
    });
  };

  const deleteNoteConfirmed = async (noteId) => {
    try {
      await deleteNote(noteId);
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
    setBodyWithNumbers(formatBodyWithNumbers(note.body));
    setEditModalVisible(true);
  };

  const resetForm = () => {
    setTitle("");
    setBody("");
    setBodyWithNumbers("");
  };

  const formatBodyWithNumbers = (bodyText) => {
    if (!bodyText) return "";
    const lines = bodyText.split("\n");
    return lines.map((line, index) => `${index + 1}. ${line}`).join("\n");
  };

  // Initialize body with "1." when user first focuses on note body
  const handleBodyFocus = () => {
    if (!body.trim()) {
      setBody("1. ");
      setBodyWithNumbers("1. ");
      setNoteStructure([{ id: 1, text: "1. ", level: 0, hasSubItems: false }]);
    }
  };

  // Convert Arabic numerals to Roman numerals
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

      // Update the main item
      setNoteStructure((prev) =>
        prev.map((item) =>
          item.id === mainItemId ? { ...item, hasSubItems: true } : item
        )
      );
    }
  };

  // Handle double tap to move between levels
  const handleDoubleTap = (itemId, currentLevel) => {
    if (currentLevel === 1) {
      // Move to main level
      const mainItem = noteStructure.find(
        (item) => item.id === itemId
      )?.parentId;
      if (mainItem) {
        // Focus on the main item
        const mainItemElement = noteStructure.find(
          (item) => item.id === mainItem
        );
        if (mainItemElement) {
          // You can implement focus logic here
          Toast.show({
            type: "info",
            text1: "Navigation",
            text2: "Moved to main section",
          });
        }
      }
    }
  };

  // Handle text input to add automatic numbering on new lines
  const handleBodyChange = (text) => {
    setBody(text);

    // Generate numbered text for display with automatic numbering
    const lines = text.split("\n");
    const numberedLines = lines.map((line, index) => {
      const trimmedLine = line.trim();

      // Skip numbering for empty lines
      if (!trimmedLine) {
        return line;
      }

      // Skip numbering if line starts with double space or 0
      if (line.startsWith("  ") || line.startsWith("0")) {
        return line;
      }

      // Check if line already has a number
      if (/^\d+\./.test(trimmedLine)) {
        return line; // Keep existing numbering
      }

      // Add automatic numbering for new lines
      return `${index + 1}. ${trimmedLine}`;
    });

    // Update the body with numbers
    const numberedText = numberedLines.join("\n");
    setBodyWithNumbers(numberedText);

    // Parse the numbered text to build structure
    const newStructure = [];
    let mainItemCounter = 0;
    let currentMainItem = null;

    numberedLines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (trimmedLine) {
        // Check if it's a main item (starts with number)
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
        }
        // Check if it's a sub-item (indented or starts with roman numeral)
        else if (line.startsWith("  ") || /^[ivxlcdm]+\./i.test(trimmedLine)) {
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
      const lines = body.split("\n");
      const currentLineIndex = lines.length - 1;
      const nextLineNumber = currentLineIndex + 1;

      // Add the new line with automatic numbering
      const newText = body + `\n${nextLineNumber}. `;
      setBody(newText);

      // Trigger the change handler to update structure
      handleBodyChange(newText);
    }
  };

  // Add sub-item inline while typing
  const addSubItemInline = (lineIndex) => {
    const lines = bodyWithNumbers.split("\n");
    const currentLine = lines[lineIndex];

    if (currentLine && /^\d+\./.test(currentLine.trim())) {
      // Insert a new line with double space for sub-item after the current line
      const newLines = [...lines];
      newLines.splice(lineIndex + 1, 0, "  ");
      const newText = newLines.join("\n");

      setBody(newText);
      handleBodyChange(newText);
    }
  };

  // Handle backspace to remove numbers when user deletes them
  const handleKeyDown = (e) => {
    console.log("handleKeyDown called", e.nativeEvent.key);
    if (e.nativeEvent.key === "Backspace") {
      const lines = body.split("\n");
      const currentLine = lines[lines.length - 1];

      // If user is deleting a number at the start of a line, remove the entire line
      if (currentLine && /^\d+\.\s*$/.test(currentLine)) {
        const newLines = lines.slice(0, -1);
        const newText = newLines.join("\n");
        setBody(newText);
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
    const mainItems = noteStructure.filter((item) => item.level === 0);
    const subItems = noteStructure.filter((item) => item.level === 1);

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
            {mainItems.map((mainItem) => (
              <View key={mainItem.id} style={styles.mainItemContainer}>
                <View style={styles.mainItemRow}>
                  <Text
                    style={[styles.mainItemText, { color: theme.colors.text }]}
                  >
                    {mainItem.text}
                  </Text>
                  <TouchableOpacity
                    onPress={() => addSubItem(mainItem.id)}
                    style={styles.addSubItemButton}
                  >
                    <MaterialIcons
                      name="add"
                      size={16}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Render sub-items */}
                {subItems
                  .filter((subItem) => subItem.parentId === mainItem.id)
                  .sort((a, b) => a.order - b.order)
                  .map((subItem) => (
                    <TouchableOpacity
                      key={subItem.id}
                      style={styles.subItemContainer}
                      onPress={() => handleDoubleTap(subItem.id, subItem.level)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.subItemText,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {toRomanNumeral(subItem.order)}.{" "}
                        {subItem.text.replace(/^[ivxlcdm]+\.\s*/i, "")}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            ))}
          </View>
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
                placeholder="Type your main points (1., 2., 3.) and use double space for sub-points (i., ii., iii.)"
              />
              {/* Inline + buttons for each main line */}
              {bodyWithNumbers.split("\n").map((line, index) => {
                const trimmedLine = line.trim();
                if (trimmedLine && /^\d+\./.test(trimmedLine)) {
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.inlineAddButton, { top: 10 + index * 24 }]}
                      onPress={() => addSubItemInline(index)}
                    >
                      <MaterialIcons
                        name="add"
                        size={16}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                  );
                }
                return null;
              })}
            </View>
          </ScrollView>
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setAddModalVisible(false)}
              style={styles.modalButton}
              textColor={theme.colors.textSecondary}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddNote}
              style={styles.modalButton}
              buttonColor={theme.colors.primary}
            >
              Save
            </Button>
          </View>
        </Modal>
      </Portal>
      {/* Edit Note Modal */}
      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
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
                placeholder="Type your main points (1., 2., 3.) and use double space for sub-points (i., ii., iii.)"
              />
              {/* Inline + buttons for each main line */}
              {bodyWithNumbers.split("\n").map((line, index) => {
                const trimmedLine = line.trim();
                if (trimmedLine && /^\d+\./.test(trimmedLine)) {
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.inlineAddButton, { top: 10 + index * 24 }]}
                      onPress={() => addSubItemInline(index)}
                    >
                      <MaterialIcons
                        name="add"
                        size={16}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                  );
                }
                return null;
              })}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setEditModalVisible(false)}
              style={styles.modalButton}
              textColor={theme.colors.textSecondary}
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
    marginTop: 8,
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
    maxHeight: "100%",
  },
  modalScrollView: {
    maxHeight: "77%",
  },
  modalInput: {
    marginBottom: 16,
    borderRadius: 12,
  },
  titleInput: {
    fontWeight: "bold",
  },
  noteBodyInput: {
    minHeight: 120,
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
});

export default NotesScreen;
