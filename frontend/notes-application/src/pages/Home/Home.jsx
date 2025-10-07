import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar'
import NoteCard from '../../components/Cards/NoteCard'
import {MdAdd} from 'react-icons/md'
import AddEditNotes from './AddEditNotes'
import {useNavigate } from 'react-router-dom';
import Modal from 'react-modal'
import axiosInstance from '../../utils/axiosInstance';
import Toast from '../../components/ToastMessage/Toast';
import EmptyCard from '../../components/EmptyCard/EmptyCard';
import AddNotesImg from "../../assets/images/add-note.svg";
import NoDataImg from "../../assets/images/no-data.svg";

const Home= () => {

const [openEditNoteModal, setOpenEditNoteModal] = React.useState({
  isShown: false,
  type:"add",
  data: null,
});

const [showToastMsg, setShowToastMsg] = useState({
  isShown: false,
  message: "",
  type: "success", 
});

const [allNotes, setAllNotes] = useState([]);
const [userInfo, setUserInfo] = useState(null);

const [isSearch, setIsSearch] = useState(false);
const [loadingNotes, setLoadingNotes] = useState(true);

const navigate = useNavigate();

const handleEdit = (notDetails) =>{
  setOpenEditNoteModal({isShown: true, data: notDetails, type: "edit"});
}

const showToastMessage = (message, type = "success") => {
   setShowToastMsg({isShown: true, message, type });
};

const handleCloseToast = () => {
   setShowToastMsg({isShown: false, message: "", type: "success" });
};

//Get user info
const getUserInfo = async () => {
  try{
    const response = await axiosInstance.get("/get-user");
    if(response.data && response.data.user){
      setUserInfo(response.data.user);
    }
  } catch(error){
    console.error("Error fetching user info:", error);
    if(error.response && error.response.status === 401){
      localStorage.clear();
      navigate("/login");
    } else {
      alert("Failed to fetch user info. Please try again later.");
    }
  }
};

//Get all notes
const getAllNotes = async () => {
  try{
    setLoadingNotes(true);
    const response = await axiosInstance.get("/get-all-notes");
    if(response.data && response.data.notes){
      setAllNotes(response.data.notes);
    }
  } catch(error){
    console.error("Error fetching notes:", error);
    alert("Failed to fetch notes. Please try again later.");
  } finally {
    setLoadingNotes(false);
  }
};

//Delete notes
  const deleteNote = async (data) => {
    const noteId = data._id;
  try{
    const response = await axiosInstance.delete("/delete-note/" + noteId);
   if(response.data && !response.data.error){
          showToastMessage("Note deleted Successfully", "delete");
          getAllNotes();
          
      }
    }
    catch(error){
      if(error.response && error.response.data && error.response.data.message){
        console.log("An unexpected error occured. Please try again later.");
      }
    }
  };

//Search for a note
const onSearchNote = async (query) => {
  try{
    const response = await axiosInstance.get("/search-notes", {
      params: {query },
    });
    if(response.data && response.data.notes){
      setIsSearch(true);
      setAllNotes(response.data.notes);
    }
  }
  catch(error){
    console.log(error)
  }
};

const updateIsPinned = async (noteData) => {
  const noteId = noteData._id;
     try{
      const response = await axiosInstance.put("/update-note-pinned/" + noteId,  {
        "isPinned": !noteId.isPinned
      });
      if(response.data && response.data.note){
          showToastMessage("Note pinned Successfully");
          getAllNotes();
      }
    }
    catch(error){
    console.log(error);
  }
};

const handleClearSearch = () => {
  setIsSearch(false);
  getAllNotes();
};

useEffect(() => {
  getAllNotes();
  getUserInfo();

  return () => {};
}, [])


return (
  <>
    <Navbar userInfo={userInfo} onSearchNote={onSearchNote} handleClearSearch={handleClearSearch} />
    <div className="container mx-auto">
      {!loadingNotes && allNotes.length > 0 ? (
        <div className="grid grid-cols-3 gap-4 mt-8">
          {allNotes.map((item, index) => (
            <NoteCard
              key={item._id}
              title={item.title}
              date={item.createdOn}
              content={item.content}
              tags={item.tags}
              isPinned={item.isPinned}
              onEdit={() => handleEdit(item)}
              onDelete={() => deleteNote(item)}
              onPinNote={() => updateIsPinned(item)}
            />
          ))}
        </div>
      ) : (
        !loadingNotes && <EmptyCard 
        imgSrc={isSearch ? NoDataImg : AddNotesImg} 
        message={isSearch? `Oops! No notes found matching your search.` : `Start creating your first note! Click the 'Add' button to jot down your thoughts, ideas, and remainders. Lets's get started!`} />
      )}
    </div>

    <button
      className="w-16 h-16 flex items-center justify-center rounded-2xl bg-primary hover:bg-blue-600 absolute right-10 bottom-10"
      onClick={() => {
        setOpenEditNoteModal({ isShown: true, type: "add", data: null });
      }}
    >
      <MdAdd className="text-[32px] text-white" />
    </button>

    <Modal
      isOpen={openEditNoteModal.isShown}
      onRequestClose={() => {
        setOpenEditNoteModal({ isShown: false, type: "add", data: null });
      }}
      style={{
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.2)",
        },
      }}
      contentLabel=""
      className="w-[40%] max-h-3/4 bg-white rounded-md mx-auto mt-14 p-5 overflow-scroll"
    >
      <AddEditNotes
        type={openEditNoteModal.type}
        noteData={openEditNoteModal.data}
        onClose={() => {
          setOpenEditNoteModal({ isShown: false, type: "add", data: null });
        }}
        getAllNotes={getAllNotes}
        showToastMessage={showToastMessage}
      />
    </Modal>

    <Toast
      isShown={showToastMsg.isShown}
      message={showToastMsg.message}
      type={showToastMsg.type}
      onClose={handleCloseToast}
    />
  </>
);
};

export default Home;