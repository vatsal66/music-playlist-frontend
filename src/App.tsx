// File: client/src/App.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Box
} from "@mui/material";

interface Song {
  name: string;
  artist: string;
  album: string;
  spotifyId?: string;
  imageUrl?: string;
}

interface Playlist {
  _id: string;
  name: string;
  description?: string;
  songs?: Song[];
}


const App = () => {
  const frontPort = 'https://music-playlist-backend-production.up.railway.app/'
  // music-playlist-backend.railway.internal
  const [tab, setTab] = useState(0);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [registerMode, setRegisterMode] = useState(false);
  const [search, setSearch] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);

  const handleAuth = async () => {
    const endpoint = registerMode ? "register" : "login";
    const res = await axios.post(`${frontPort}api/${endpoint}`, { email, password });
    if (res.data.token) {
      if (!registerMode) {
        setTab(1);
      }
      setToken(res.data.token);
    }
  };

  const fetchPlaylists = async () => {
    const res = await axios.get(`${frontPort}api/api/playlists`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setPlaylists(res.data);
  };

  const createOrUpdatePlaylist = async () => {
    if (editId) {
      await axios.put(
        `${frontPort}api/playlists/${editId}`,
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      await axios.post(
        `${frontPort}api/playlists`,
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    setName("");
    setDescription("");
    setEditId(null);
    fetchPlaylists();
  };

  const deletePlaylist = async (id: string) => {
    await axios.delete(`${frontPort}api/playlists/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchPlaylists();
  };

  const editPlaylist = (playlist: Playlist) => {
    setEditId(playlist._id);
    setName(playlist.name);
    setDescription(playlist.description || "");
  };

  const searchSongs = async () => {
    const res = await axios.get(`${frontPort}api/spotify/search?q=${encodeURIComponent(search)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSongs(res.data.tracks);
  };

  const addSongToPlaylist = async (playlistId: string, song: Song) => {
    await axios.post(
      `${frontPort}api/playlists/${playlistId}/songs`,
      song,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert("Song added to playlist!");
  };

  useEffect(() => {
    if (token) fetchPlaylists();
  }, [token]);

  useEffect(() => {

    if (tab === 1) {
      fetchPlaylists();
    }

  }, [tab])

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Music Playlist App</Typography>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <Tab label="Login/Register" />
          <Tab label="Dashboard" disabled={!token} />
          <Tab label="Search Songs" disabled={!token} />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h5">{registerMode ? "Register" : "Login"}</Typography>
            <TextField fullWidth margin="normal" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextField
              fullWidth
              margin="normal"
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button variant="contained" onClick={handleAuth} sx={{ mt: 2 }}>
              {registerMode ? "Register" : "Login"}
            </Button>
            <Button onClick={() => setRegisterMode(!registerMode)} sx={{ mt: 2, ml: 2 }}>
              {registerMode ? "Switch to Login" : "Switch to Register"}
            </Button>
          </Box>
        )}

        {tab === 1 && token && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h5">{editId ? "Edit Playlist" : "Create Playlist"}</Typography>
            <TextField
              fullWidth
              margin="normal"
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button variant="contained" onClick={createOrUpdatePlaylist} sx={{ mt: 2 }}>
              {editId ? "Update" : "Create"}
            </Button>
            {editId && (
              <Button onClick={() => {
                setEditId(null);
                setName("");
                setDescription("");
              }} sx={{ mt: 2, ml: 2 }}>
                Cancel
              </Button>
            )}

            <Typography variant="h6" sx={{ mt: 4 }}>
              Your Playlists
            </Typography>
            {playlists.map((p) => (
  <Card key={p._id} sx={{ my: 2 }}>
    <CardContent>
      <Typography variant="h6">{p.name}</Typography>
      <Typography variant="body2">{p.description}</Typography>

      {/* Songs list */}
      {p.songs && p.songs.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            Songs in Playlist:
          </Typography>
          {p.songs.map((song, index) => (
            <Box key={index} sx={{ mb: 1, pl: 2 }}>
              <Typography variant="body2">
                {song.name} — {song.artist} ({song.album})
              </Typography>
            </Box>
          ))}
        </>
      )}

      <Button onClick={() => deletePlaylist(p._id)} sx={{ mt: 1 }} color="error">
        Delete
      </Button>
      <Button onClick={() => editPlaylist(p)} sx={{ mt: 1, ml: 1 }}>
        Edit
      </Button>
    </CardContent>
  </Card>
))}

          </Box>
        )}

        {tab === 2 && token && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h5">Search Songs (Spotify)</Typography>
            <TextField
              fullWidth
              margin="normal"
              label="Search songs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="contained" onClick={searchSongs} sx={{ mt: 2 }}>
              Search
            </Button>

            <Box sx={{ mt: 4 }}>
              {songs.map((song, index) => (
                <Card key={index} sx={{ my: 2 }}>
                  <CardContent>
                    <Typography variant="h6">{song.name}</Typography>
                    <Typography variant="body2">Artist: {song.artist}</Typography>
                    <Typography variant="body2">Album: {song.album}</Typography>
                    {playlists.map((p) => (
                      <Button
                        key={p._id}
                        variant="outlined"
                        sx={{ mt: 1, mr: 1 }}
                        onClick={() => addSongToPlaylist(p._id, song)}
                      >
                        Add to {p.name}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default App;
