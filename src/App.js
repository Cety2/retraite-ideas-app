import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Video, Plus, Search, User, Home, Lightbulb, Calendar, Play, Settings, Upload, BarChart3, Eye, Download, Trash2, FileText, Camera, X } from 'lucide-react';

// Configuration Supabase
const supabaseUrl = 'https://tofwqhumabkolooosdry.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZndxaHVtYWJrb2xvb29zZHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MjEzOTEsImV4cCI6MjA2NjM5NzM5MX0.reb3t2PpiEjcNV07r8Pur4ja5QrPpoWl0IMtilci0Pg';

// Client Supabase simplifié avec Storage
class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.headers = {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`
    };
  }

  from(table) {
    return {
      select: async (columns = '*') => {
        try {
          const response = await fetch(`${this.url}/rest/v1/${table}?select=${columns}`, {
            headers: this.headers
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          return { data, error: null };
        } catch (error) {
          console.error(`Erreur SELECT ${table}:`, error);
          return { data: [], error: error.message };
        }
      },
      
      insert: async (values) => {
        try {
          const response = await fetch(`${this.url}/rest/v1/${table}`, {
            method: 'POST',
            headers: { ...this.headers, 'Prefer': 'return=representation' },
            body: JSON.stringify(values)
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
          
          const data = await response.json();
          return { data, error: null };
        } catch (error) {
          console.error(`Erreur INSERT ${table}:`, error);
          return { data: null, error: error.message };
        }
      },
      
      update: (values) => ({
        eq: async (column, value) => {
          try {
            const response = await fetch(`${this.url}/rest/v1/${table}?${column}=eq.${value}`, {
              method: 'PATCH',
              headers: { ...this.headers, 'Prefer': 'return=representation' },
              body: JSON.stringify(values)
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            return { data, error: null };
          } catch (error) {
            console.error(`Erreur UPDATE ${table}:`, error);
            return { data: null, error: error.message };
          }
        }
      }),
      
      delete: () => ({
        eq: async (column, value) => {
          try {
            const response = await fetch(`${this.url}/rest/v1/${table}?${column}=eq.${value}`, {
              method: 'DELETE',
              headers: this.headers
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            return { error: null };
          } catch (error) {
            console.error(`Erreur DELETE ${table}:`, error);
            return { error: error.message };
          }
        }
      }),

      // Ajout de la fonction neq pour les suppressions multiples
      neq: (column, value) => ({
        delete: async () => {
          try {
            const response = await fetch(`${this.url}/rest/v1/${table}?${column}=neq.${value}`, {
              method: 'DELETE',
              headers: this.headers
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            return { error: null };
          } catch (error) {
            console.error(`Erreur DELETE NEQ ${table}:`, error);
            return { error: error.message };
          }
        }
      })
    };
  }

  // Ajout du support pour Supabase Storage
  get storage() {
    return {
      from: (bucket) => ({
        upload: async (path, file, options = {}) => {
          try {
            const formData = new FormData();
            formData.append('file', file);
            
            const uploadHeaders = {
              'apikey': this.key,
              'Authorization': `Bearer ${this.key}`
            };

            // Ajouter les options de cache si spécifiées
            if (options.cacheControl) {
              uploadHeaders['cache-control'] = options.cacheControl;
            }

            const response = await fetch(`${this.url}/storage/v1/object/${bucket}/${path}`, {
              method: 'POST',
              headers: uploadHeaders,
              body: formData
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            return { data, error: null };
          } catch (error) {
            console.error('Erreur upload storage:', error);
            return { data: null, error: error.message };
          }
        },

        getPublicUrl: (path) => {
          return {
            data: {
              publicUrl: `${this.url}/storage/v1/object/public/${bucket}/${path}`
            }
          };
        },

        remove: async (paths) => {
          try {
            const response = await fetch(`${this.url}/storage/v1/object/${bucket}`, {
              method: 'DELETE',
              headers: this.headers,
              body: JSON.stringify({ prefixes: paths })
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            return { data, error: null };
          } catch (error) {
            console.error('Erreur delete storage:', error);
            return { data: null, error: error.message };
          }
        }
      })
    };
  }
}

const supabase = new SupabaseClient(supabaseUrl, supabaseKey);

const YouthRetreatIdeasApp = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [memoryFilter, setMemoryFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // États pour les modales
  const [currentModal, setCurrentModal] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [selectedIdea, setSelectedIdea] = useState(null);

  // États pour les données
  const [ideas, setIdeas] = useState([]);
  const [memories, setMemories] = useState([]);
  const [moods, setMoods] = useState({
    motivated: 0,
    relax: 0,
    excited: 0,
    inspired: 0
  });
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [meditationResponses, setMeditationResponses] = useState([]);

  // Catégories
  const categories = [
    { id: 'all', name: 'Toutes', icon: '✅', color: 'from-purple-500 to-pink-500' },
    { id: 'jeux', name: 'Jeux & Défis', icon: '🎯', color: 'from-blue-500 to-cyan-500' },
    { id: 'sport', name: 'Sport & Action', icon: '⚽', color: 'from-orange-500 to-red-500' },
    { id: 'creative', name: 'Créatif & Art', icon: '🎨', color: 'from-pink-500 to-rose-500' },
    { id: 'spectacle', name: 'Spectacle & Music', icon: '🎤', color: 'from-indigo-500 to-purple-500' },
    { id: 'cuisine', name: 'Cuisine & Partage', icon: '🍳', color: 'from-yellow-500 to-orange-500' },
    { id: 'nature', name: 'Nature & Détente', icon: '🌿', color: 'from-green-500 to-emerald-500' },
    { id: 'spirituel', name: 'Spirituel & Réflexion', icon: '🙏', color: 'from-violet-500 to-purple-500' }
  ];

  // Fonctions de chargement des données
  const fetchIdeas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('ideas').select('*');
      if (error) throw new Error(error);
      
      console.log('Ideas chargées:', data);
      setIdeas(data || []);
    } catch (error) {
      console.error('Erreur chargement ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemories = async () => {
    try {
      const { data, error } = await supabase.from('memories').select('*');
      if (error) throw new Error(error);
      
      console.log('Memories chargées:', data);
      setMemories(data || []);
    } catch (error) {
      console.error('Erreur chargement memories:', error);
    }
  };

  const fetchMoods = async () => {
    try {
      const { data, error } = await supabase.from('moods').select('*');
      if (error) throw new Error(error);
      
      console.log('Moods chargés:', data);
      const moodsObj = { motivated: 0, relax: 0, excited: 0, inspired: 0 };
      
      data.forEach(mood => {
        if (moodsObj.hasOwnProperty(mood.mood_type)) {
          moodsObj[mood.mood_type] = mood.count || 0;
        }
        
        // Récupérer l'URL de la vidéo teaser
        if (mood.mood_type === 'video_teaser' && mood.video_url) {
          console.log('URL vidéo trouvée en base:', mood.video_url);
          setUploadedVideo(mood.video_url);
        }
      });
      
      setMoods(moodsObj);
    } catch (error) {
      console.error('Erreur chargement moods:', error);
      setMoods({ motivated: 0, relax: 0, excited: 0, inspired: 0 });
    }
  };

  const fetchMeditationResponses = async () => {
    try {
      const { data, error } = await supabase.from('meditation_responses').select('*');
      if (error) throw new Error(error);
      
      console.log('Réponses méditation chargées:', data);
      setMeditationResponses(data || []);
    } catch (error) {
      console.error('Erreur chargement réponses méditation:', error);
    }
  };

  // Initialiser l'entrée vidéo si elle n'existe pas
  const initVideoEntry = async () => {
    try {
      const { data } = await supabase.from('moods')
        .select('*')
        .eq('mood_type', 'video_teaser');
      
      if (!data || data.length === 0) {
        await supabase.from('moods').insert({
          mood_type: 'video_teaser',
          count: 0,
          video_url: null
        });
        console.log('Entrée video_teaser créée');
      }
    } catch (error) {
      console.warn('Erreur init video entry:', error);
    }
  };

  // Charger toutes les données au démarrage
  useEffect(() => {
    fetchIdeas();
    fetchMemories();
    fetchMoods();
    fetchMeditationResponses();
    initVideoEntry();
  }, []);

  // Scroll au changement de page
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Fonctions utilitaires
  const closeAllModals = () => {
    setCurrentModal(null);
    setSelectedMemory(null);
    setSelectedIdea(null);
  };

  const filteredIdeas = ideas
    .filter(idea => selectedCategory === 'all' || idea.category === selectedCategory)
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  // Handlers
  const handleLike = async (ideaId) => {
    try {
      const idea = ideas.find(i => i.id === ideaId);
      if (!idea) return;
      
      const newLikes = (idea.likes || 0) + 1;
      const { error } = await supabase.from('ideas').update({ likes: newLikes }).eq('id', ideaId);
      
      if (error) throw new Error(error);
      
      setIdeas(prev => prev.map(i => 
        i.id === ideaId ? { ...i, likes: newLikes } : i
      ));
    } catch (error) {
      console.error('Erreur like:', error);
      alert('Erreur lors du like: ' + error.message);
    }
  };

  const handleDeleteMeditationResponse = async (responseId) => {
    try {
      const { error } = await supabase.from('meditation_responses').delete().eq('id', responseId);
      if (error) throw new Error(error);
      
      setMeditationResponses(prev => prev.filter(r => r.id !== responseId));
      alert('✅ Livret de méditation supprimé !');
    } catch (error) {
      console.error('Erreur suppression réponse méditation:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };

  const handleDeleteIdea = async (ideaId) => {
    if (!window.confirm('🗑️ Supprimer cette idée ?')) return;
    
    try {
      const { error } = await supabase.from('ideas').delete().eq('id', ideaId);
      if (error) throw new Error(error);
      
      setIdeas(prev => prev.filter(i => i.id !== ideaId));
      closeAllModals();
      alert('✅ Idée supprimée !');
    } catch (error) {
      console.error('Erreur suppression idea:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };

  const handleDeleteMemory = async (memoryId) => {
    if (!window.confirm('🗑️ Supprimer ce souvenir ?')) return;
    
    try {
      // Récupérer le souvenir pour obtenir l'URL de l'image
      const memory = memories.find(m => m.id === memoryId);
      
      // Supprimer le souvenir de la base
      const { error } = await supabase.from('memories').delete().eq('id', memoryId);
      if (error) throw new Error(error);
      
      // Si le souvenir avait une image dans Supabase Storage, la supprimer aussi
      if (memory && memory.image_url && memory.image_url.includes('supabase.co/storage')) {
        try {
          // Extraire le chemin du fichier depuis l'URL
          const urlParts = memory.image_url.split('/storage/v1/object/public/images/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1];
            console.log('Suppression image storage:', filePath);
            
            await supabase.storage
              .from('images')
              .remove([filePath]);
            
            console.log('Image supprimée du storage');
          }
        } catch (storageError) {
          console.warn('Erreur suppression image storage (non bloquant):', storageError);
        }
      }
      
      setMemories(prev => prev.filter(m => m.id !== memoryId));
      closeAllModals();
      alert('✅ Souvenir supprimé !');
    } catch (error) {
      console.error('Erreur suppression memory:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };

  const handleViewIdea = (idea) => {
    setSelectedIdea(idea);
    setCurrentModal('idea-detail');
  };

  const handleViewMemory = (memory) => {
    setSelectedMemory(memory);
    setCurrentModal('memory-detail');
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'admin@15') {
      setIsAdmin(true);
      setActiveTab('admin');
      setShowAdminModal(false);
      setAdminPassword('');
      alert('Connexion admin réussie !');
    } else {
      alert('Mot de passe incorrect');
    }
  };

  const handleMoodClick = async (moodType) => {
    try {
      const newCount = (moods[moodType] || 0) + 1;
      
      const { error } = await supabase.from('moods').update({ 
        count: newCount, 
        updated_at: new Date().toISOString() 
      }).eq('mood_type', moodType);
      
      if (error) throw new Error(error);
      
      setMoods(prev => ({ ...prev, [moodType]: newCount }));
    } catch (error) {
      console.error('Erreur mood update:', error);
      // Mise à jour locale en cas d'erreur
      setMoods(prev => ({ ...prev, [moodType]: (prev[moodType] || 0) + 1 }));
    }
  };

  // Navigation
  const Navigation = () => (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              RetraiteIdeas
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {[
              { id: 'home', icon: Home, label: 'Accueil' },
              { id: 'explore', icon: Search, label: 'Explorer' },
              { id: 'memories', icon: Camera, label: 'Souvenirs' },
              { id: 'meditation', icon: FileText, label: 'Méditation' },
              { id: 'teaser', icon: Video, label: 'Teaser Vidéo' },
              ...(isAdmin ? [{ id: 'admin', icon: Settings, label: 'Administration' }] : [])
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                  activeTab === id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105' 
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            {!isAdmin ? (
              <button
                onClick={() => setShowAdminModal(true)}
                className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center hover:from-purple-500 hover:to-pink-500 transition-all duration-300"
                title="Connexion administrateur"
              >
                <span className="text-white font-semibold text-sm">A</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsAdmin(false);
                  setActiveTab('home');
                  alert('Déconnexion admin');
                }}
                className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center hover:from-red-500 hover:to-red-600 transition-all duration-300"
                title="Déconnexion admin"
              >
                <span className="text-white font-semibold text-sm">A</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );

  // Page d'accueil
  const HomePage = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Notre Retraite, <br />
            <span className="text-yellow-300">Nos Idées</span> 😊

          </h1>
          <p className="text-xl mb-6 opacity-90">
            Participons à façonner Une retraite divine et partageons nos idées !
          </p>
          <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold">En ligne</span>
            </div>
            <p className="text-sm opacity-90">
            </p>
          </div>
        </div>
      </div>

      {/* Zone Mood */}
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
        <h2 className="text-2xl font-bold text-center mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          💭 Comment te sens-tu ?
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Clique plusieurs fois sur ton ressenti 
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: 'motivated', emoji: '🔥', label: 'Motivé(e)', count: moods.motivated || 0 },
            { key: 'relax', emoji: '😎', label: 'Relax', count: moods.relax || 0 },
            { key: 'excited', emoji: '🤩', label: 'Excité(e)', count: moods.excited || 0 },
            { key: 'inspired', emoji: '💭', label: 'Inspiré(e)', count: moods.inspired || 0 }
          ].map((mood) => (
            <button
              key={mood.key}
              onClick={() => handleMoodClick(mood.key)}
              className="bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 p-4 rounded-xl text-center transition-all duration-300 transform hover:scale-105 border border-purple-100"
            >
              <div className="text-3xl mb-2">{mood.emoji}</div>
              <div className="text-sm font-semibold text-gray-700">{mood.label}</div>
              <div className="text-lg font-bold text-purple-600">{mood.count}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-4">🎯</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Prêt pour la RJ 2025 ?</h3>
        <p className="text-gray-600 text-lg">
          Clique sur la lampe à droite pour partager tes idées 👉🏽
        </p>
      </div>
    </div>
  );

  // Carte d'idée
  const IdeaCard = ({ idea, onLike }) => (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 h-full flex flex-col">
      <div className="flex items-start justify-between mb-4 flex-1">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 mb-2">{idea.title || 'Titre manquant'}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-3 flex-1">{idea.description || 'Description manquante'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span className="flex items-center">
          <User className="w-4 h-4 mr-1" />
          {idea.author || 'Anonyme'} ({idea.age || 'N/A'})
        </span>
        <span className="flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          {idea.created_at ? new Date(idea.created_at).toLocaleDateString('fr-FR') : 'Récent'}
        </span>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex space-x-4">
          <button 
            onClick={() => onLike(idea.id)}
            className="flex items-center space-x-1 text-gray-600 hover:text-red-500 transition-colors duration-200"
          >
            <Heart className="w-4 h-4" />
            <span className="min-w-[20px] text-center">{idea.likes || 0}</span>
          </button>
          <button 
            onClick={() => handleViewIdea(idea)}
            className="flex items-center space-x-1 text-gray-600 hover:text-blue-500 transition-colors duration-200"
          >
            <Eye className="w-4 h-4" />
            <span>Voir</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Page d'exploration
  const ExplorePage = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Boîte à idées 🔍</h1>
      
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        {/* Version desktop */}
        <div className="hidden md:flex md:flex-wrap gap-3">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                selectedCategory === category.id
                  ? `bg-gradient-to-r ${category.color} text-white shadow-lg transform scale-105`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
        
        {/* Version mobile */}
        <div className="md:hidden">
          <div className="max-h-32 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 text-left ${
                  selectedCategory === category.id
                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Chargement des idées...</h3>
          <p className="text-gray-500">Connexion à la base de données</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIdeas.map(idea => (
              <IdeaCard key={idea.id} idea={idea} onLike={handleLike} />
            ))}
          </div>

          {filteredIdeas.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune idée trouvée</h3>
              <p className="text-gray-500">
                {ideas.length === 0 
                  ? "Soyez le premier à proposer une idée !" 
                  : "Aucune idée dans cette catégorie."
                }
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Carte de souvenir
  const MemoryCard = ({ memory, isAdmin = false }) => {
    if (!memory) return null;

    const typeIcons = {
      moment: '🌟',
      photo: '📸',
      anecdote: '😄',
      reflexion: '💭'
    };

    const typeLabels = {
      moment: 'Moment marquant',
      photo: 'Photo/Selfie',
      anecdote: 'Anecdote drôle',
      reflexion: 'Réflexion'
    };

    const typeColors = {
      moment: 'from-yellow-500 to-orange-500',
      photo: 'from-blue-500 to-cyan-500',
      anecdote: 'from-green-500 to-emerald-500',
      reflexion: 'from-purple-500 to-pink-500'
    };

    return (
      <div 
        className={`bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 group ${!isAdmin ? 'cursor-pointer' : ''} h-full flex flex-col`}
        onClick={() => !isAdmin && handleViewMemory(memory)}
      >
        {memory.image_url && (
          <div className="relative">
            <img 
              src={memory.image_url} 
              alt={memory.title || 'Souvenir'}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                console.error('Erreur chargement image:', memory.image_url);
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            {/* Placeholder en cas d'erreur */}
            <div className="w-full h-48 bg-gray-100 rounded-t-2xl flex items-center justify-center" style={{ display: 'none' }}>
              <div className="text-center text-gray-500">
                <Camera className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm">Image non disponible</span>
              </div>
            </div>
            
            <div className={`absolute top-3 left-3 px-3 py-1 rounded-full bg-gradient-to-r ${typeColors[memory.type] || 'from-gray-400 to-gray-500'} text-white text-xs font-semibold flex items-center space-x-1`}>
              <span>{typeIcons[memory.type] || '📝'}</span>
              <span>{typeLabels[memory.type] || 'Souvenir'}</span>
            </div>         
            
            {!isAdmin && (
              <div className="absolute bottom-3 right-3 bg-white bg-opacity-90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Eye className="w-4 h-4 text-purple-600" />
              </div>
            )}
          </div>
        )}
        
        <div className="p-6 flex-1 flex flex-col">
          {!memory.image_url && (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{typeIcons[memory.type] || '📝'}</span>
                <span className={`text-xs px-3 py-1 rounded-full bg-gradient-to-r ${typeColors[memory.type] || 'from-gray-400 to-gray-500'} text-white font-semibold`}>
                  {typeLabels[memory.type] || 'Souvenir'}
                </span>
              </div>
              {!isAdmin && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
              )}
            </div>
          )}

          <h3 className="text-lg font-bold text-gray-800 mb-3">{memory.title || 'Titre non disponible'}</h3>
          <p className="text-gray-600 text-sm mb-4 leading-relaxed flex-1" style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {memory.description || 'Description non disponible'}
          </p>

          <div className="flex items-center justify-between text-sm text-gray-500 mt-auto">
            <span className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              {memory.author || 'Facilitateurs'}
            </span>
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {memory.created_at ? new Date(memory.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
            </span>
            {isAdmin && (
              <div className="flex space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewMemory(memory);
                  }}
                  className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                  title="Voir les détails"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMemory(memory.id);
                  }}
                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                  title="Supprimer ce souvenir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Page des souvenirs
  const MemoriesPage = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">📸 Nos Souvenirs</h1>
          <p className="text-xl mb-6 opacity-90">Revivons ensemble les plus beaux moments de notre retraite ! ✨</p>
        </div>
        <div className="absolute top-4 right-4 text-6xl opacity-20">📷</div>
        <div className="absolute bottom-4 left-4 text-4xl opacity-20">🎉</div>
        <div className="absolute top-1/2 left-8 text-3xl opacity-20">💫</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { 
            label: 'Souvenirs partagés', 
            value: memories.length.toString(), 
            icon: '📸', 
            color: 'from-blue-500 to-cyan-500',
            filter: 'all'
          },
          { 
            label: 'Moments marquants', 
            value: memories.filter(m => m.type === 'moment').length.toString(), 
            icon: '🌟', 
            color: 'from-purple-500 to-pink-500',
            filter: 'moment'
          },
          { 
            label: 'Photos partagées', 
            value: memories.filter(m => m.image_url).length.toString(), 
            icon: '📷', 
            color: 'from-green-500 to-emerald-500',
            filter: 'photo'
          },
          { 
            label: 'Anecdotes drôles', 
            value: memories.filter(m => m.type === 'anecdote').length.toString(), 
            icon: '😄', 
            color: 'from-orange-500 to-red-500',
            filter: 'anecdote'
          }
        ].map((stat, index) => (
          <button 
            key={index} 
            onClick={() => setMemoryFilter(stat.filter)}
            className={`bg-gradient-to-r ${stat.color} p-6 rounded-2xl text-white text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
          >
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm opacity-90">{stat.label}</div>
          </button>
        ))}
      </div>

      {memoryFilter && (
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              📚 {memoryFilter === 'all' ? 'Tous les souvenirs' : 
                   memoryFilter === 'moment' ? 'Moments marquants' :
                   memoryFilter === 'photo' ? 'Photos partagées' :
                   memoryFilter === 'anecdote' ? 'Anecdotes drôles' : 'Souvenirs'}
            </h2>
            <button 
              onClick={() => setMemoryFilter(null)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← Retour
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memories
              .filter(memory => {
                if (memoryFilter === 'all') return true;
                if (memoryFilter === 'photo') return memory.image_url;
                return memory.type === memoryFilter;
              })
              .map(memory => (
                <MemoryCard key={memory.id} memory={memory} />
              ))
            }
          </div>

          {memories.filter(memory => {
            if (memoryFilter === 'all') return true;
            if (memoryFilter === 'photo') return memory.image_url;
            return memory.type === memoryFilter;
          }).length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun souvenir trouvé</h3>
              <p className="text-gray-500">Il n'y a pas encore de souvenirs dans cette catégorie.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );

  // Page de méditation avec le livret
  const MeditationPage = () => {
    const [formData, setFormData] = useState({
      name: '',
      age: '',
      // Section 1: Ma marche avec Dieu
      relation_with_god: '',
      prayer_life: '',
      god_presence: '',
      spiritual_growth: '',
      faith_discoveries: '',
      spiritual_victories: '',
      spiritual_struggles: '',
      nourishing_disciplines: '',
      disciplines_to_develop: '',
      
      // Section 2: Ma vie quotidienne  
      work_studies_blessings: '',
      family_blessings: '',
      friendships_blessings: '',
      health_blessings: '',
      personal_projects_blessings: '',
      main_challenges: '',
      difficulty_management: '',
      help_in_difficulties: '',
      god_in_decisions_examples: '',
      god_in_decisions_obstacles: '',
      domains_to_consult_god: '',
      
      // Section 3: Mon état intérieur
      heart_burdens: '',
      discouragements: '',
      unhealed_wounds: '',
      what_brings_life: '',
      gratitude: '',
      sources_of_joy: '',
      passions_motivations: '',
      current_needs: '',
      main_aspirations: '',
      
      // Section 4: Projections et engagements
      worries_to_confide: '',
      burdens_to_abandon: '',
      dreams_and_projects: '',
      things_to_change: '',
      concrete_engagements_prayer: '',
      concrete_engagements_bible: '',
      concrete_engagements_relations: '',
      concrete_engagements_community: '',
      concrete_engagements_personal: '',
      vision_coming_months: '',
      spiritual_objectives: '',
      person_to_become: '',
      personal_notes: ''
    });
    
    const [currentSection, setCurrentSection] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const sections = [
      {
        title: "🙏 Ma marche avec Dieu",
        subtitle: "Relation spirituelle actuelle",
        questions: [
          { key: 'relation_with_god', label: 'Où en suis-je dans ma relation avec Dieu aujourd\'hui ?', type: 'textarea' },
          { key: 'prayer_life', label: 'Comment décrirais-je ma vie de prière ces derniers mois ?', type: 'textarea' },
          { key: 'god_presence', label: 'Quand ai-je ressenti la présence de Dieu de manière particulière récemment ?', type: 'textarea' },
          { key: 'spiritual_growth', label: 'Moments de croissance spirituelle :', type: 'textarea' },
          { key: 'faith_discoveries', label: 'Découvertes dans ma foi :', type: 'textarea' },
          { key: 'spiritual_victories', label: 'Victoires spirituelles :', type: 'textarea' },
          { key: 'spiritual_struggles', label: 'Où ai-je ressenti un éloignement ou des luttes spirituelles ?', type: 'textarea' },
          { key: 'nourishing_disciplines', label: 'Quelles disciplines spirituelles me nourrissent le plus ? (prière, lecture biblique, jeûne, méditation, louange...)', type: 'textarea' },
          { key: 'disciplines_to_develop', label: 'Lesquelles aimerais-je développer ou reprendre ?', type: 'textarea' }
        ]
      },
      {
        title: "🌱 Ma vie quotidienne",
        subtitle: "Bénédictions et défis",
        questions: [
          { key: 'work_studies_blessings', label: 'Bénédictions reçues dans mes études/mon travail :', type: 'textarea' },
          { key: 'family_blessings', label: 'Bénédictions reçues dans ma famille :', type: 'textarea' },
          { key: 'friendships_blessings', label: 'Bénédictions reçues dans mes relations amicales :', type: 'textarea' },
          { key: 'health_blessings', label: 'Bénédictions reçues pour ma santé :', type: 'textarea' },
          { key: 'personal_projects_blessings', label: 'Bénédictions reçues dans mes projets personnels :', type: 'textarea' },
          { key: 'main_challenges', label: 'Quels ont été mes principaux défis cette année ?', type: 'textarea' },
          { key: 'difficulty_management', label: 'Comment ai-je géré les difficultés ?', type: 'textarea' },
          { key: 'help_in_difficulties', label: 'Qu\'est-ce qui m\'a aidé à traverser les moments difficiles ?', type: 'textarea' },
          { key: 'god_in_decisions_examples', label: 'Ai-je impliqué Dieu dans mes décisions quotidiennes ? Si oui, comment ? Donnez des exemples concrets', type: 'textarea' },
          { key: 'god_in_decisions_obstacles', label: 'Si non, qu\'est-ce qui m\'en a empêché ?', type: 'textarea' },
          { key: 'domains_to_consult_god', label: 'Dans quels domaines aimerais-je davantage consulter Dieu ?', type: 'textarea' }
        ]
      },
      {
        title: "💭 Mon état intérieur",
        subtitle: "Ce qui me pèse et ce qui me vivifie",
        questions: [
          { key: 'heart_burdens', label: 'Qu\'est-ce qui me pèse sur le cœur ?', type: 'textarea' },
          { key: 'discouragements', label: 'Qu\'est-ce qui me décourage ou me préoccupe ?', type: 'textarea' },
          { key: 'unhealed_wounds', label: 'Y a-t-il des blessures non guéries que je porte ?', type: 'textarea' },
          { key: 'what_brings_life', label: 'Qu\'est-ce qui me rend vivant(e) et joyeux(se) ?', type: 'textarea' },
          { key: 'gratitude', label: 'Pour quoi suis-je particulièrement reconnaissant(e) ?', type: 'textarea' },
          { key: 'sources_of_joy', label: 'Quelles sont mes sources de joie et d\'espoir ?', type: 'textarea' },
          { key: 'passions_motivations', label: 'Qu\'est-ce qui me passionne et me motive ?', type: 'textarea' },
          { key: 'current_needs', label: 'De quoi ai-je le plus besoin dans ma vie en ce moment ?', type: 'textarea' },
          { key: 'main_aspirations', label: 'Quelles sont mes principales aspirations ?', type: 'textarea' }
        ]
      },
      {
        title: "🎯 Projections et engagements",
        subtitle: "Vers l'avenir avec Dieu",
        questions: [
          { key: 'worries_to_confide', label: 'Quelles inquiétudes veux-je confier à Dieu ?', type: 'textarea' },
          { key: 'burdens_to_abandon', label: 'Quels fardeaux dois-je abandonner ?', type: 'textarea' },
          { key: 'dreams_and_projects', label: 'Quels rêves et projets veux-je placer entre ses mains ?', type: 'textarea' },
          { key: 'things_to_change', label: 'Qu\'est-ce que je dois laisser tomber ou changer ?', type: 'textarea' },
          { key: 'concrete_engagements_prayer', label: 'Engagements concrets pour ma vie de prière :', type: 'textarea' },
          { key: 'concrete_engagements_bible', label: 'Engagements concrets pour ma lecture biblique et méditation :', type: 'textarea' },
          { key: 'concrete_engagements_relations', label: 'Engagements concrets pour mes relations (famille, communauté, amis...) :', type: 'textarea' },
          { key: 'concrete_engagements_community', label: 'Engagements concrets pour les activités de la communauté :', type: 'textarea' },
          { key: 'concrete_engagements_personal', label: 'Engagements concrets pour ma croissance personnelle (formation, discipline, santé...) :', type: 'textarea' },
          { key: 'vision_coming_months', label: 'Comment vois-je les prochains mois ?', type: 'textarea' },
          { key: 'spiritual_objectives', label: 'Quels sont mes objectifs spirituels ?', type: 'textarea' },
          { key: 'person_to_become', label: 'Quelle personne veux-je devenir ?', type: 'textarea' },
          { key: 'personal_notes', label: 'Notes personnelles (réflexions, prières, engagements importants) :', type: 'textarea' }
        ]
      }
    ];

    const handleInputChange = (key, value) => {
      setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
      if (!formData.name || !formData.age) {
        alert('Merci de renseigner votre nom et âge ! 😊');
        return;
      }
      
      setSubmitting(true);
      try {
        const response = {
          ...formData,
          submitted_at: new Date().toISOString()
        };
        
        console.log('Envoi réponse méditation:', response);
        const { error } = await supabase.from('meditation_responses').insert([response]);
        if (error) throw new Error(error);
        
        await fetchMeditationResponses();
        alert('🙏 Votre livret de méditation a été envoyé ! Merci pour ce partage sincère 💫');
        
        // Reset form
        setFormData({
          name: '', age: '', relation_with_god: '', prayer_life: '', god_presence: '', 
          spiritual_growth: '', faith_discoveries: '', spiritual_victories: '', 
          spiritual_struggles: '', nourishing_disciplines: '', disciplines_to_develop: '', 
          work_studies_blessings: '', family_blessings: '', friendships_blessings: '', 
          health_blessings: '', personal_projects_blessings: '', main_challenges: '', 
          difficulty_management: '', help_in_difficulties: '', god_in_decisions_examples: '', 
          god_in_decisions_obstacles: '', domains_to_consult_god: '', heart_burdens: '', 
          discouragements: '', unhealed_wounds: '', what_brings_life: '', gratitude: '', 
          sources_of_joy: '', passions_motivations: '', current_needs: '', main_aspirations: '', 
          worries_to_confide: '', burdens_to_abandon: '', dreams_and_projects: '', 
          things_to_change: '', concrete_engagements_prayer: '', 
          concrete_engagements_bible: '', concrete_engagements_relations: '', 
          concrete_engagements_community: '', concrete_engagements_personal: '', 
          vision_coming_months: '', spiritual_objectives: '', person_to_become: '', 
          personal_notes: ''
        });
        setCurrentSection(0);
      } catch (error) {
        console.error('Erreur envoi méditation:', error);
        alert('Erreur lors de l\'envoi: ' + error.message);
      } finally {
        setSubmitting(false);
      }
    };

    const nextSection = () => {
      if (currentSection < sections.length - 1) {
        setCurrentSection(currentSection + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    const prevSection = () => {
      if (currentSection > 0) {
        setCurrentSection(currentSection - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    const currentSectionData = sections[currentSection];
    const progress = ((currentSection + 1) / sections.length) * 100;

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">📖 Livret de Méditation</h1>
            <p className="text-xl mb-2 opacity-90">La pause : Faire le point pour mieux avancer</p>
            <p className="text-sm opacity-80 italic">2 Corinthiens 13:5 - "Examinez-vous vous-mêmes, pour voir si vous êtes dans la foi. Éprouvez-vous vous-mêmes..."</p>
          </div>
        </div>

        {/* Informations personnelles */}
        {currentSection === 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">✨ Informations personnelles</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Votre prénom"
              />
              <select
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Choisissez votre âge</option>
                <option value="13-15">13-15 ans</option>
                <option value="16-18">16-18 ans</option>
                <option value="19-25">19-25 ans</option>
                <option value="26+">26+ ans</option>
              </select>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-800 mb-3">📝 Instructions</h3>
              <div className="text-blue-700 space-y-2 text-sm">
                <p>• Prenez le temps nécessaire pour chaque question</p>
                <p>• Répondez en toute honnêteté, sans jugement envers vous-même</p>
                <p>• Certaines questions peuvent nécessiter plusieurs jours de réflexion</p>
                <p>• Vous pouvez sauvegarder et revenir plus tard si besoin</p>
              </div>
            </div>
          </div>
        )}

        {/* Barre de progression */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Section {currentSection + 1}/{sections.length}: {currentSectionData.title}
            </h3>
            <span className="text-sm text-gray-600">{Math.round(progress)}% complété</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Questions de la section courante */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 text-gray-800">{currentSectionData.title}</h2>
            <p className="text-gray-600 text-lg">{currentSectionData.subtitle}</p>
          </div>

          <div className="space-y-8">
            {currentSectionData.questions.map((question, index) => (
              <div key={question.key} className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  {index + 1}. {question.label}
                </label>
                {question.type === 'textarea' ? (
                  <textarea
                    value={formData[question.key] || ''}
                    onChange={(e) => handleInputChange(question.key, e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Prenez le temps de réfléchir et partagez vos pensées..."
                  />
                ) : (
                  <input
                    type="text"
                    value={formData[question.key] || ''}
                    onChange={(e) => handleInputChange(question.key, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Votre réponse..."
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Boutons de navigation */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center">
            <button
              onClick={prevSection}
              disabled={currentSection === 0}
              className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Section précédente
            </button>

            {currentSection === sections.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting || !formData.name || !formData.age}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {submitting ? '⏳ Envoi...' : '🙏 Terminer et envoyer'}
              </button>
            ) : (
              <button
                onClick={nextSection}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-300"
              >
                Section suivante →
              </button>
            )}
          </div>
        </div>

        {/* Citation de fin */}
        {currentSection === sections.length - 1 && (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">🙏</div>
            <p className="text-gray-700 italic mb-4">
              "Seigneur, merci pour ce temps de pause et de réflexion. Tu connais mon cœur mieux que moi-même. 
              Je te confie mes joies et mes défis, mes réussites et mes échecs, mes rêves et mes craintes."
            </p>
            <p className="text-gray-600 text-sm">
              Prenez un moment pour prier avant d'envoyer vos réflexions.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Page teaser
  const TeaserPage = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">🎬 Teaser Vidéo de la Retraite</h1>
        <p className="text-gray-600">Découvre un aperçu de ce qui t'attend grâce aux idées de la communauté !</p>
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 text-white text-center">
        {uploadedVideo ? (
          <div className="bg-black rounded-2xl overflow-hidden">
            <video 
              controls 
              className="w-full h-64 md:h-96"
              preload="metadata"
            >
              <source src={uploadedVideo} />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
            <div className="p-4 bg-gray-900">
              <h2 className="text-xl font-bold text-white">Retraite 2025 - Teaser Officiel</h2>
              <p className="opacity-90 text-sm text-gray-300">Basé sur vos idées les plus créatives !</p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-black/20 rounded-2xl p-12 mb-6">
              <Play className="w-16 h-16 mx-auto mb-4 opacity-80" />
              <h2 className="text-2xl font-bold mb-2">Retraite 2025 - Teaser à venir</h2>
              <p className="opacity-90">Le teaser sera bientôt disponible...</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-sm opacity-80">
                🎬 Nos organisateurs préparent une vidéo géniale basée sur vos idées !
              </p>
            </div>
          </>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">🎬 Quelles idées ont été retenues ?</h2>
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🤔</div>
          <p className="text-gray-600 mb-4">
            Regarde le teaser et devine quelles activités géniales t'attendent à la retraite...
          </p>
        </div>
      </div>
    </div>
  );

  // Page admin complète
  const AdminPage = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [activeAdminSection, setActiveAdminSection] = useState('overview');

    const handleVideoUpload = async (event) => {
      const file = event.target.files[0];
      if (file && file.type.startsWith('video/')) {
        setIsUploading(true);
        
        try {
          // Vérifier la taille du fichier (max 50MB pour les vidéos)
          if (file.size > 50 * 1024 * 1024) {
            alert('Vidéo trop volumineuse ! Maximum 50MB autorisé.');
            setIsUploading(false);
            return;
          }

          // Générer un nom de fichier unique
          const fileExt = file.name.split('.').pop();
          const fileName = `teaser-${Date.now()}.${fileExt}`;
          const filePath = `videos/${fileName}`;

          console.log('Upload vidéo vers Supabase Storage:', filePath);
          
          // Upload vers Supabase Storage
          const { data, error } = await supabase.storage
            .from('images') // Utilise le même bucket que les images
            .upload(filePath, file, {
              cacheControl: '3600'
            });

          if (error) {
            throw new Error(error.message);
          }

          console.log('Vidéo uploadée:', data);

          // Récupérer l'URL publique
          const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);

          console.log('URL publique vidéo:', publicUrl);
          
          // Sauvegarder l'URL dans un état persistant
          setUploadedVideo(publicUrl);

          // Sauvegarder l'URL en base de données
          try {
            const { error: dbError } = await supabase.from('moods')
              .update({ 
                video_url: publicUrl,
                updated_at: new Date().toISOString() 
              })
              .eq('mood_type', 'video_teaser');
            
            if (dbError) {
              console.warn('Erreur sauvegarde URL vidéo en base:', dbError);
            } else {
              console.log('URL vidéo sauvegardée en base:', publicUrl);
            }
          } catch (dbError) {
            console.warn('Erreur sauvegarde URL vidéo:', dbError);
          }

          setIsUploading(false);
          alert('🎉 Vidéo téléchargée et sauvegardée avec succès !');
          
        } catch (error) {
          console.error('Erreur upload vidéo:', error);
          alert('Erreur lors de l\'upload de la vidéo: ' + error.message);
          setIsUploading(false);
        }
      } else {
        alert('Veuillez sélectionner un fichier vidéo valide (MP4, AVI, MOV, etc.)');
      }
    };

    const exportIdeas = async () => {
      try {
        const { data: ideasData } = await supabase.from('ideas').select('*');
        const { data: memoriesData } = await supabase.from('memories').select('*');
        const { data: moodsData } = await supabase.from('moods').select('*');
        const { data: meditationData } = await supabase.from('meditation_responses').select('*');
        
        const exportData = {
          ideas: ideasData || [],
          memories: memoriesData || [],
          moods: moodsData || [],
          meditation_responses: meditationData || [],
          exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `retraite_data_${new Date().toISOString().split('T')[0]}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        alert('Erreur lors de l\'export des données');
      }
    };

    const resetToDefaultData = async () => {
      if (window.confirm('⚠️ Êtes-vous sûr de vouloir réinitialiser toutes les données aux valeurs par défaut ? Cette action est irréversible !')) {
        try {
          await supabase.from('ideas').neq('id', 0).delete();
          await supabase.from('memories').neq('id', 0).delete();
          await supabase.from('meditation_responses').neq('id', 0).delete();
          
          const defaultIdeas = [
            {
              title: "Escape Game Géant en Pleine Nature",
              description: "Créer un parcours d'énigmes dans la forêt avec des défis d'équipe et des messages cachés sur la foi.",
              category: "jeux",
              author: "Facilitateurs",
              age: "16-18",
              likes: 23
            }
          ];
          
          const defaultMemories = [
            {
              title: "Le feu de camp magique ✨",
              description: "Cette soirée autour du feu restera gravée dans ma mémoire ! Les chants, les rires, et cette ambiance si spéciale...",
              author: "Facilitateurs",
              type: "moment"
            }
          ];
          
          await supabase.from('ideas').insert(defaultIdeas);
          await supabase.from('memories').insert(defaultMemories);
          
          await fetchIdeas();
          await fetchMemories();
          await fetchMeditationResponses();
          
          // Supprimer la vidéo teaser mais garder l'entrée
          await supabase.from('moods').update({ video_url: null }).eq('mood_type', 'video_teaser');
          setUploadedVideo(null);
          alert('✅ Données réinitialisées aux valeurs par défaut !');
        } catch (error) {
          console.error('Erreur lors de la réinitialisation:', error);
          alert('Erreur lors de la réinitialisation');
        }
      }
    };

    const clearAllData = async () => {
      if (window.confirm('🚨 ATTENTION ! Voulez-vous supprimer TOUTES les données ? Cette action est irréversible !')) {
        try {
          // Récupérer toutes les images et vidéos avant suppression pour nettoyer le storage
          const { data: memoriesWithImages } = await supabase.from('memories').select('image_url');
          
          // Supprimer les données des tables
          await supabase.from('ideas').neq('id', 0).delete();
          await supabase.from('memories').neq('id', 0).delete();
          await supabase.from('meditation_responses').neq('id', 0).delete();
          await supabase.from('moods').update({ count: 0 }).neq('id', 0);
          
          // Nettoyer les images et vidéos du storage
          const allStorageFiles = [];
          
          // Ajouter les images des souvenirs
          if (memoriesWithImages && memoriesWithImages.length > 0) {
            const imagePaths = memoriesWithImages
              .filter(m => m.image_url && m.image_url.includes('supabase.co/storage'))
              .map(m => {
                const urlParts = m.image_url.split('/storage/v1/object/public/images/');
                return urlParts.length > 1 ? urlParts[1] : null;
              })
              .filter(Boolean);
            allStorageFiles.push(...imagePaths);
          }
          
          // Ajouter la vidéo teaser si elle existe
          if (uploadedVideo && uploadedVideo.includes('supabase.co/storage')) {
            const urlParts = uploadedVideo.split('/storage/v1/object/public/images/');
            if (urlParts.length > 1) {
              allStorageFiles.push(urlParts[1]);
            }
          }
          
          // Supprimer tous les fichiers du storage
          if (allStorageFiles.length > 0) {
            try {
              console.log('Suppression fichiers storage:', allStorageFiles);
              await supabase.storage.from('images').remove(allStorageFiles);
            } catch (storageError) {
              console.warn('Erreur nettoyage storage (non bloquant):', storageError);
            }
          }
          
          // Supprimer l'URL de la vidéo teaser de la base
          await supabase.from('moods').update({ video_url: null }).eq('mood_type', 'video_teaser');
          
          await fetchIdeas();
          await fetchMemories();
          await fetchMoods();
          await fetchMeditationResponses();
          
          setUploadedVideo(null);
          alert('🗑️ Toutes les données ont été supprimées !');
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression');
        }
      }
    };

    const adminSections = [
      { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
      { id: 'video', label: 'Gestion Vidéo', icon: Video },
      { id: 'memories', label: 'Souvenirs', icon: Camera },
      { id: 'ideas', label: 'Idées d\'activités', icon: Lightbulb },
      { id: 'meditation', label: 'Livrets de Méditation', icon: FileText },
      { id: 'data', label: 'Données & Exports', icon: Download }
    ];

    const renderAdminSection = () => {
      switch(activeAdminSection) {
        case 'overview':
          return (
            <div className="space-y-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <Lightbulb className="w-8 h-8" />
                    <span className="text-2xl font-bold">{ideas.length}</span>
                  </div>
                  <h3 className="font-semibold text-blue-100">Idées reçues</h3>
                  <p className="text-blue-200 text-sm">Activités proposées</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <Camera className="w-8 h-8" />
                    <span className="text-2xl font-bold">{memories.length}</span>
                  </div>
                  <h3 className="font-semibold text-purple-100">Souvenirs</h3>
                  <p className="text-purple-200 text-sm">Moments partagés</p>
                </div>

                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <FileText className="w-8 h-8" />
                    <span className="text-2xl font-bold">{meditationResponses.length}</span>
                  </div>
                  <h3 className="font-semibold text-indigo-100">Livrets Méditation</h3>
                  <p className="text-indigo-200 text-sm">Réflexions reçues</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <Video className="w-8 h-8" />
                    <span className="text-2xl font-bold">{uploadedVideo ? '1' : '0'}</span>
                  </div>
                  <h3 className="font-semibold text-green-100">Teaser Vidéo</h3>
                  <p className="text-green-200 text-sm">{uploadedVideo ? 'Active' : 'Non configurée'}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h3 className="text-xl font-bold mb-6 flex items-center">
                  <BarChart3 className="w-6 h-6 mr-3 text-purple-600" />
                  Répartition des idées par catégorie
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {categories.filter(c => c.id !== 'all').map(category => {
                    const count = ideas.filter(idea => idea.category === category.id).length;
                    const percentage = ideas.length > 0 ? Math.round((count / ideas.length) * 100) : 0;
                    
                    return (
                      <div key={category.id} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3 mb-4">
                          <span className="text-2xl">{category.icon}</span>
                          <span className="font-semibold text-gray-800">{category.name}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-end space-x-2">
                            <span className="text-3xl font-bold text-purple-600">{count}</span>
                            <span className="text-sm text-gray-500">idée(s)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`bg-gradient-to-r ${category.color} h-2 rounded-full transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500">{percentage}% du total</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );

        case 'video':
          return (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <Video className="w-6 h-6 mr-3 text-purple-600" />
                  Gestion du Teaser Vidéo
                </h2>
                
                {uploadedVideo ? (
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span className="text-green-800 font-semibold text-lg">Vidéo active</span>
                      </div>
                      <p className="text-green-700">
                        Le teaser est maintenant visible par tous les utilisateurs dans l'onglet "Teaser Vidéo"
                      </p>
                      {uploadedVideo.includes('supabase.co/storage') && (
                        <p className="text-green-600 text-sm mt-2">
                          ☁️ Vidéo stockée de façon permanente dans le cloud
                        </p>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-800 mb-4">Aperçu de la vidéo :</h3>
                      <div className="bg-black rounded-lg overflow-hidden max-w-md">
                        <video controls className="w-full h-48">
                          <source src={uploadedVideo} />
                        </video>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        if (window.confirm('🗑️ Supprimer la vidéo teaser ?')) {
                          try {
                            // Si c'est une URL Supabase, supprimer du storage
                            if (uploadedVideo && uploadedVideo.includes('supabase.co/storage')) {
                              const urlParts = uploadedVideo.split('/storage/v1/object/public/images/');
                              if (urlParts.length > 1) {
                                const filePath = urlParts[1];
                                console.log('Suppression vidéo storage:', filePath);
                                
                                await supabase.storage
                                  .from('images')
                                  .remove([filePath]);
                                
                                console.log('Vidéo supprimée du storage');
                              }
                              
                              // Supprimer l'URL de la base de données
                              await supabase.from('moods')
                                .update({ video_url: null })
                                .eq('mood_type', 'video_teaser');
                              
                            } else if (uploadedVideo) {
                              // Si c'est une URL blob locale, la libérer
                              URL.revokeObjectURL(uploadedVideo);
                            }
                            
                            setUploadedVideo(null);
                            alert('✅ Vidéo supprimée avec succès');
                          } catch (error) {
                            console.error('Erreur suppression vidéo:', error);
                            setUploadedVideo(null); // Supprimer quand même localement
                            alert('⚠️ Vidéo supprimée localement (erreur storage: ' + error.message + ')');
                          }
                        }
                      }}
                      className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span>Supprimer la vidéo</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                      {isUploading ? (
                        <div>
                          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-6"></div>
                          <p className="text-gray-600 text-lg">Téléchargement en cours...</p>
                          <p className="text-gray-500 text-sm mt-2">Sauvegarde dans le cloud...</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                          <h3 className="text-xl font-semibold text-gray-700 mb-3">
                            Télécharger le teaser vidéo
                          </h3>
                          <p className="text-gray-500 mb-6">
                            Glissez votre fichier vidéo ici ou cliquez pour sélectionner
                          </p>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoUpload}
                            className="hidden"
                            id="video-upload"
                          />
                          <label
                            htmlFor="video-upload"
                            className="bg-purple-600 text-white px-8 py-4 rounded-xl cursor-pointer hover:bg-purple-700 transition-colors inline-block font-semibold"
                          >
                            Choisir un fichier
                          </label>
                          <p className="text-sm text-gray-400 mt-4">
                            Formats supportés : MP4, AVI, MOV (max 50MB)
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );

        case 'memories':
          return (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <Camera className="w-6 h-6 mr-3 text-purple-600" />
                  Gestion des Souvenirs
                </h2>
                
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-800 font-semibold">Total Souvenirs</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{memories.length}</p>
                    <p className="text-blue-700 text-sm">souvenirs partagés</p>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <Camera className="w-4 h-4 text-purple-600" />
                      <span className="text-purple-800 font-semibold">Avec Photos</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-600">{memories.filter(m => m.image_url).length}</p>
                    <p className="text-purple-700 text-sm">photos uploadées</p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-800 font-semibold">Moments Marquants</span>
                    </div>
                    <p className="text-3xl font-bold text-green-600">{memories.filter(m => m.type === 'moment').length}</p>
                    <p className="text-green-700 text-sm">moments spéciaux</p>
                  </div>
                </div>

                {memories.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun souvenir partagé</h3>
                    <p className="text-gray-500">Les souvenirs apparaîtront ici une fois partagés par les participants</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {memories.map(memory => (
                      <MemoryCard key={memory.id} memory={memory} isAdmin={true} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );

        case 'ideas':
          return (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <Lightbulb className="w-6 h-6 mr-3 text-purple-600" />
                  Gestion des Idées d'Activités
                </h2>
                
                {ideas.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Lightbulb className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune idée reçue</h3>
                    <p className="text-gray-500">Les idées d'activités apparaîtront ici une fois proposées par les participants</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <p className="text-gray-600">
                        <span className="font-semibold text-gray-800">{ideas.length}</span> idée(s) d'activité proposée(s)
                      </p>
                      <div className="text-sm text-gray-500">
                        Total des likes : <span className="font-semibold">{ideas.reduce((sum, idea) => sum + (idea.likes || 0), 0)}</span>
                      </div>
                    </div>
                    
                    {ideas.map((idea) => (
                      <div key={idea.id} className="border border-gray-200 rounded-xl p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 text-lg mb-2">{idea.title}</h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{idea.description}</p>
                          </div>
                          <div className="flex items-center space-x-2 ml-6">
                            <button
                              onClick={() => handleViewIdea(idea)}
                              className="p-3 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Voir les détails"
                            >
                              <FileText className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteIdea(idea.id)}
                              className="p-3 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Supprimer cette idée"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {idea.author} ({idea.age})
                            </span>
                            <span className="flex items-center">
                              <Heart className="w-4 h-4 mr-1 text-red-500" />
                              {idea.likes || 0} likes
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${categories.find(c => c.id === idea.category)?.color} text-white text-xs font-semibold`}>
                              {categories.find(c => c.id === idea.category)?.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {idea.created_at ? new Date(idea.created_at).toLocaleDateString('fr-FR') : 'Récent'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );

        case 'meditation':
          return (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FileText className="w-6 h-6 mr-3 text-purple-600" />
                  Livrets de Méditation Reçus
                </h2>
                
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                      <span className="text-purple-800 font-semibold">Total Livrets</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-600">{meditationResponses.length}</p>
                    <p className="text-purple-700 text-sm">livrets reçus</p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-800 font-semibold">Participants</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{new Set(meditationResponses.map(r => r.name)).size}</p>
                    <p className="text-blue-700 text-sm">jeunes uniques</p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <Calendar className="w-4 h-4 text-green-600" />
                      <span className="text-green-800 font-semibold">Récents</span>
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                      {meditationResponses.filter(r => {
                        const submittedDate = new Date(r.submitted_at);
                        const today = new Date();
                        const diffTime = Math.abs(today - submittedDate);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays <= 7;
                      }).length}
                    </p>
                    <p className="text-green-700 text-sm">cette semaine</p>
                  </div>
                </div>

                {meditationResponses.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun livret reçu</h3>
                    <p className="text-gray-500">Les livrets de méditation apparaîtront ici une fois complétés par les jeunes</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Livrets par participant</h3>
                    
                    {meditationResponses.map((response, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 cursor-pointer hover:from-purple-100 hover:to-pink-100 transition-colors"
                          onClick={() => {
                            const content = document.getElementById(`response-${index}`);
                            content.style.display = content.style.display === 'none' ? 'block' : 'none';
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-lg font-bold text-gray-800 mb-1">
                                🙏 {response.name || 'Anonyme'}
                              </h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>👤 {response.age || 'Âge non renseigné'}</span>
                                <span>📅 {response.submitted_at ? new Date(response.submitted_at).toLocaleDateString('fr-FR') : 'Date inconnue'}</span>
                              </div>
                            </div>
                            <div className="text-gray-400">
                              <span className="text-sm">Cliquez pour voir les réponses</span>
                            </div>
                          </div>
                        </div>
                        
                        <div id={`response-${index}`} style={{ display: 'none' }} className="p-6 bg-white border-t border-gray-100">
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Section 1: Ma marche avec Dieu */}
                            <div className="space-y-6">
                              <h5 className="text-lg font-semibold text-purple-700 border-b border-purple-200 pb-2">
                                🙏 Ma marche avec Dieu
                              </h5>
                              
                              {[
                                { key: 'relation_with_god', label: 'Relation avec Dieu' },
                                { key: 'prayer_life', label: 'Vie de prière' },
                                { key: 'god_presence', label: 'Présence de Dieu ressentie' },
                                { key: 'spiritual_growth', label: 'Croissance spirituelle' },
                                { key: 'spiritual_victories', label: 'Victoires spirituelles' },
                                { key: 'spiritual_struggles', label: 'Luttes spirituelles' },
                                { key: 'nourishing_disciplines', label: 'Disciplines nourrissantes' },
                                { key: 'disciplines_to_develop', label: 'Disciplines à développer' }
                              ].map(field => (
                                response[field.key] && (
                                  <div key={field.key} className="bg-purple-50 rounded-lg p-4">
                                    <h6 className="font-semibold text-purple-800 text-sm mb-2">{field.label}</h6>
                                    <p className="text-gray-700 text-sm">{response[field.key]}</p>
                                  </div>
                                )
                              ))}
                            </div>
                            
                            {/* Section 2: Ma vie quotidienne */}
                            <div className="space-y-6">
                              <h5 className="text-lg font-semibold text-blue-700 border-b border-blue-200 pb-2">
                                🌱 Ma vie quotidienne
                              </h5>
                              
                              {[
                                { key: 'work_studies_blessings', label: 'Bénédictions travail/études' },
                                { key: 'family_blessings', label: 'Bénédictions famille' },
                                { key: 'main_challenges', label: 'Principaux défis' },
                                { key: 'difficulty_management', label: 'Gestion des difficultés' },
                                { key: 'god_in_decisions_examples', label: 'Dieu dans les décisions' },
                                { key: 'domains_to_consult_god', label: 'Domaines à consulter Dieu' }
                              ].map(field => (
                                response[field.key] && (
                                  <div key={field.key} className="bg-blue-50 rounded-lg p-4">
                                    <h6 className="font-semibold text-blue-800 text-sm mb-2">{field.label}</h6>
                                    <p className="text-gray-700 text-sm">{response[field.key]}</p>
                                  </div>
                                )
                              ))}
                            </div>
                            
                            {/* Section 3: État intérieur */}
                            <div className="space-y-6">
                              <h5 className="text-lg font-semibold text-green-700 border-b border-green-200 pb-2">
                                💭 Mon état intérieur
                              </h5>
                              
                              {[
                                { key: 'heart_burdens', label: 'Ce qui pèse sur le cœur' },
                                { key: 'what_brings_life', label: 'Ce qui apporte la vie' },
                                { key: 'gratitude', label: 'Reconnaissances' },
                                { key: 'sources_of_joy', label: 'Sources de joie' },
                                { key: 'passions_motivations', label: 'Passions et motivations' },
                                { key: 'current_needs', label: 'Besoins actuels' }
                              ].map(field => (
                                response[field.key] && (
                                  <div key={field.key} className="bg-green-50 rounded-lg p-4">
                                    <h6 className="font-semibold text-green-800 text-sm mb-2">{field.label}</h6>
                                    <p className="text-gray-700 text-sm">{response[field.key]}</p>
                                  </div>
                                )
                              ))}
                            </div>
                            
                            {/* Section 4: Projections et engagements */}
                            <div className="space-y-6">
                              <h5 className="text-lg font-semibold text-orange-700 border-b border-orange-200 pb-2">
                                🎯 Projections et engagements
                              </h5>
                              
                              {[
                                { key: 'worries_to_confide', label: 'Inquiétudes à confier' },
                                { key: 'dreams_and_projects', label: 'Rêves et projets' },
                                { key: 'concrete_engagements_prayer', label: 'Engagements prière' },
                                { key: 'concrete_engagements_bible', label: 'Engagements lecture biblique' },
                                { key: 'vision_coming_months', label: 'Vision prochains mois' },
                                { key: 'spiritual_objectives', label: 'Objectifs spirituels' },
                                { key: 'person_to_become', label: 'Personne à devenir' }
                              ].map(field => (
                                response[field.key] && (
                                  <div key={field.key} className="bg-orange-50 rounded-lg p-4">
                                    <h6 className="font-semibold text-orange-800 text-sm mb-2">{field.label}</h6>
                                    <p className="text-gray-700 text-sm">{response[field.key]}</p>
                                  </div>
                                )
                              ))}
                              
                              {response.personal_notes && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <h6 className="font-semibold text-gray-800 text-sm mb-2">📝 Notes personnelles</h6>
                                  <p className="text-gray-700 text-sm">{response.personal_notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                            <button
                              onClick={() => {
                                if (window.confirm('🗑️ Supprimer ce livret de méditation ?')) {
                                  // Fonction pour supprimer la réponse
                                  handleDeleteMeditationResponse(response.id);
                                }
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Supprimer</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );

        case 'data':
          return (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <Download className="w-6 h-6 mr-3 text-purple-600" />
                  Gestion des Données
                </h2>
                
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-green-800 font-semibold text-lg">Stockage de données</span>
                    </div>
                    <p className="text-green-700 mb-4">
                      Toutes les données sont maintenant persistantes dans le cloud !
                    </p>
                    <div className="space-y-2 text-sm text-green-600">
                      <div>• {ideas.length} idée(s) d'activité</div>
                      <div>• {memories.length} souvenir(s) partagé(s)</div>
                      <div>• {meditationResponses.length} livret(s) de méditation</div>
                      <div>• {memories.filter(m => m.image_url).length} image(s) stockée(s)</div>
                      <div>• {uploadedVideo ? '1 vidéo teaser' : 'Aucune vidéo teaser'}</div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Download className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-800 font-semibold text-lg">Export & Sauvegarde</span>
                    </div>
                    <p className="text-blue-700 mb-4">
                      Exportez les données au format JSON pour une sauvegarde externe.
                    </p>
                    <p className="text-blue-600 text-sm">
                      Les images et vidéos restent dans le cloud Supabase.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800">Actions de gestion</h3>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <button
                      onClick={exportIdeas}
                      className="flex flex-col items-center justify-center space-y-3 bg-blue-600 text-white p-6 rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-8 h-8" />
                      <div className="text-center">
                        <div className="font-semibold">Exporter les données</div>
                        <div className="text-blue-200 text-sm">Format JSON</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={resetToDefaultData}
                      className="flex flex-col items-center justify-center space-y-3 bg-orange-600 text-white p-6 rounded-xl hover:bg-orange-700 transition-colors"
                    >
                      <span className="text-2xl">🔄</span>
                      <div className="text-center">
                        <div className="font-semibold">Réinitialiser</div>
                        <div className="text-orange-200 text-sm">Données par défaut</div>
                      </div>
                    </button>

                    <button
                      onClick={clearAllData}
                      className="flex flex-col items-center justify-center space-y-3 bg-red-600 text-white p-6 rounded-xl hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-8 h-8" />
                      <div className="text-center">
                        <div className="font-semibold">Tout supprimer</div>
                        <div className="text-red-200 text-sm">Action irréversible</div>
                      </div>
                    </button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start space-x-3">
                      <div className="text-blue-600 text-xl">ℹ️</div>
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-2">Stockage Cloud</h4>
                        <p className="text-blue-700 text-sm mb-3">
                          Toutes les données sont stockées dans Supabase (PostgreSQL + Storage). 
                          Les utilisateurs voient les mêmes données en temps réel !
                        </p>
                        <div className="bg-blue-100 rounded-lg p-3">
                          <h5 className="font-semibold text-blue-800 text-sm mb-2">📸 Images & 🎬 Vidéos</h5>
                          <p className="text-blue-700 text-xs mb-2">
                            Les fichiers médias sont stockés dans Supabase Storage avec des URLs publiques permanentes.
                          </p>
                          <div className="text-blue-600 text-xs space-y-1">
                            <div>• Images : bucket 'images' dans dossier 'memories/'</div>
                            <div>• Vidéos : bucket 'images' dans dossier 'videos/'</div>
                            <div>• URLs sauvegardées en base de données</div>
                            <div>• Livrets de méditation : table 'meditation_responses'</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <h1 className="text-3xl font-bold text-gray-800">🔧 Administration</h1>
          <div className="bg-green-100 text-green-800 px-6 py-3 rounded-full text-sm font-semibold">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Connecté en tant qu'administrateur</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-2 shadow-lg">
          <div className="flex flex-wrap gap-2">
            {adminSections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveAdminSection(section.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeAdminSection === section.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <section.icon className="w-5 h-5" />
                <span className="font-medium">{section.label}</span>
              </button>
            ))}
          </div>
        </div>

        {renderAdminSection()}
      </div>
    );
  };

  // Formulaires et modales...

  const IdeaForm = () => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      category: '',
      why: '',
      logistics: '',
      name: '',
      age: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
      if (!formData.title || !formData.description || !formData.category || !formData.age) {
        alert('Merci de remplir tous les champs obligatoires ! 😊');
        return;
      }
      
      setSubmitting(true);
      try {
        const newIdea = {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          why: formData.why || null,
          logistics: formData.logistics || null,
          author: formData.name || 'Facilitateurs',
          age: formData.age,
          likes: 0
        };
        
        console.log('Envoi nouvelle idée:', newIdea);
        const { error } = await supabase.from('ideas').insert([newIdea]);
        if (error) throw new Error(error);
        
        await fetchIdeas();
        closeAllModals();
        alert('🎉 Ton idée a été partagée ! Merci pour ta contribution 💫');
        setActiveTab('explore');
      } catch (error) {
        console.error('Erreur ajout idée:', error);
        alert('Erreur lors de l\'ajout: ' + error.message);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ton prénom"
          />
          <select
            value={formData.age}
            onChange={(e) => setFormData({...formData, age: e.target.value})}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choisis ton âge</option>
            <option value="13-15">13-15 ans</option>
            <option value="16-18">16-18 ans</option>
            <option value="19-25">19-25 ans</option>
            <option value="26+">26+ ans</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            🎯 Type d'activité
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.filter(c => c.id !== 'all').map(category => (
              <button
                key={category.id}
                type="button"
                onClick={() => setFormData({...formData, category: category.id})}
                className={`p-4 rounded-xl text-center transition-all duration-300 ${
                  formData.category === category.id
                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg transform scale-105`
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="text-2xl mb-1">{category.icon}</div>
                <div className="text-sm font-semibold">{category.name}</div>
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Nom de ton activité (ex: Escape Game Géant...)"
        />

        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Décris ton activité : comment ça se déroule ? Combien de personnes ? Durée ?"
        />

        <textarea
          value={formData.why}
          onChange={(e) => setFormData({...formData, why: e.target.value})}
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Pourquoi cette activité serait géniale ?"
        />

        <textarea
          value={formData.logistics}
          onChange={(e) => setFormData({...formData, logistics: e.target.value})}
          rows={2}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Infos pratiques : matériel, espace, coût..."
        />

        <div className="flex space-x-4">
          <button
            onClick={closeAllModals}
            disabled={submitting}
            className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-bold hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            {submitting ? '⏳ Envoi...' : '🚀 Proposer !'}
          </button>
        </div>
      </div>
    );
  };

  const MemoryForm = () => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      type: 'moment',
      name: '',
      image: null
    });
    const [submitting, setSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Fonction pour uploader une image vers Supabase Storage
    const uploadImageToSupabase = async (file) => {
      try {
        setUploadingImage(true);
        
        // Générer un nom de fichier unique
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `memories/${fileName}`;

        console.log('Upload image vers:', filePath);
        
        // Upload vers Supabase Storage
        const { data, error } = await supabase.storage
          .from('images')
          .upload(filePath, file, {
            cacheControl: '3600'
          });

        if (error) {
          throw new Error(error);
        }

        console.log('Image uploadée:', data);

        // Récupérer l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        console.log('URL publique:', publicUrl);
        return publicUrl;

      } catch (error) {
        console.error('Erreur upload image:', error);
        throw error;
      } finally {
        setUploadingImage(false);
      }
    };

    const handleSubmit = async () => {
      if (!formData.title || !formData.description) {
        alert('Merci de remplir au moins le titre et la description ! 😊');
        return;
      }

      setSubmitting(true);
      try {
        let imageUrl = null;

        // Si il y a une image à uploader
        if (formData.imageFile) {
          try {
            imageUrl = await uploadImageToSupabase(formData.imageFile);
          } catch (error) {
            alert('Erreur lors de l\'upload de l\'image: ' + error.message);
            setSubmitting(false);
            return;
          }
        }

        const newMemory = {
          title: formData.title,
          description: formData.description,
          author: formData.name || 'Facilitateurs',
          type: formData.type,
          image_url: imageUrl
        };

        console.log('Envoi nouveau souvenir:', newMemory);
        const { error } = await supabase.from('memories').insert([newMemory]);
        if (error) throw new Error(error);

        await fetchMemories();
        closeAllModals();
        alert('🎉 Ton souvenir a été partagé ! Merci de garder ces moments vivants 💫');
      } catch (error) {
        console.error('Erreur lors de l\'ajout du souvenir:', error);
        alert('Erreur lors de l\'ajout du souvenir: ' + error.message);
      } finally {
        setSubmitting(false);
      }
    };

    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (file && file.type.startsWith('image/')) {
        // Vérifier la taille du fichier (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image trop volumineuse ! Maximum 5MB autorisé.');
          return;
        }

        // Créer un aperçu local ET garder le fichier pour l'upload
        const imageUrl = URL.createObjectURL(file);
        setFormData({
          ...formData, 
          image: imageUrl,
          imageFile: file
        });
      } else {
        alert('Veuillez sélectionner un fichier image valide (JPG, PNG, etc.)');
      }
    };

    const removeImage = () => {
      if (formData.image) {
        URL.revokeObjectURL(formData.image);
      }
      setFormData({
        ...formData,
        image: null,
        imageFile: null
      });
    };

    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Ton prénom"
          />
          <select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="moment">🌟 Moment marquant</option>
            <option value="photo">📸 Photo/Selfie</option>
            <option value="anecdote">😄 Anecdote drôle</option>
            <option value="reflexion">💭 Réflexion/Découverte</option>
          </select>
        </div>

        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Titre de ton souvenir..."
        />

        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={5}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          placeholder="Raconte-nous ce moment spécial..."
        />

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
          {formData.image ? (
            <div className="space-y-4">
              <img src={formData.image} alt="Aperçu" className="max-w-xs mx-auto rounded-lg" />
              <div className="flex items-center justify-center space-x-4">
                <span className="text-sm text-gray-600">
                  📷 Image sélectionnée • {formData.imageFile ? Math.round(formData.imageFile.size / 1024) + ' KB' : ''}
                </span>
                <button
                  onClick={removeImage}
                  className="text-red-600 hover:text-red-800 text-sm"
                  disabled={uploadingImage}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ) : (
            <>
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="memory-image"
                disabled={uploadingImage}
              />
              <label 
                htmlFor="memory-image" 
                className={`bg-purple-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-purple-700 transition-colors inline-block ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploadingImage ? 'Upload en cours...' : 'Choisir une photo'}
              </label>
              <p className="text-sm text-gray-500 mt-2">
                JPG, PNG, GIF • Maximum 5MB
              </p>
            </>
          )}
        </div>

        {uploadingImage && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-blue-800 font-semibold">Upload de l'image en cours...</span>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              Sauvegarde dans le cloud Supabase...
            </p>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={closeAllModals}
            disabled={submitting || uploadingImage}
            className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || uploadingImage}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            {submitting ? '⏳ Envoi...' : uploadingImage ? '📤 Upload...' : '🌟 Partager !'}
          </button>
        </div>
      </div>
    );
  };

  const MemoryDetail = ({ memory }) => {
    if (!memory) {
      return (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Souvenir introuvable</h3>
          <p className="text-gray-500">Ce souvenir n'existe plus ou n'a pas pu être chargé.</p>
        </div>
      );
    }

    const typeIcons = { moment: '🌟', photo: '📸', anecdote: '😄', reflexion: '💭' };
    const typeLabels = { moment: 'Moment marquant', photo: 'Photo/Selfie', anecdote: 'Anecdote drôle', reflexion: 'Réflexion/Découverte' };
    const typeColors = { moment: 'from-yellow-500 to-orange-500', photo: 'from-blue-500 to-cyan-500', anecdote: 'from-green-500 to-emerald-500', reflexion: 'from-purple-500 to-pink-500' };

    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-3xl">{typeIcons[memory.type] || '📝'}</span>
            <span className={`px-4 py-2 rounded-full bg-gradient-to-r ${typeColors[memory.type] || 'from-gray-400 to-gray-500'} text-white text-sm font-semibold`}>
              {typeLabels[memory.type] || 'Souvenir'}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">{memory.title || 'Titre non disponible'}</h3>
        </div>

        {memory.image_url && (
          <div className="text-center">
            <div className="relative inline-block">
              <img 
                src={memory.image_url} 
                alt={memory.title || 'Souvenir'} 
                className="max-w-full h-auto rounded-2xl shadow-lg mx-auto" 
                style={{ maxHeight: '400px' }}
                onError={(e) => {
                  console.error('Erreur chargement image:', memory.image_url);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              {/* Placeholder en cas d'erreur */}
              <div className="bg-gray-100 rounded-2xl p-8 shadow-lg" style={{ display: 'none' }}>
                <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Image non disponible</p>
                <p className="text-gray-400 text-sm mt-1">L'image n'a pas pu être chargée</p>
              </div>
              
            
            </div>
          </div>
        )}

        <div>
          <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Ce que {memory.author || 'Facilitateurs'} nous raconte :
          </h4>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{memory.description || 'Description non disponible'}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-700">Partagé par :</span>
              <span className="text-gray-600">{memory.author || 'Facilitateurs'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-700">Date :</span>
              <span className="text-gray-600">
                {memory.created_at ? new Date(memory.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
              </span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-red-800 mb-1">Actions administrateur</h4>
                <p className="text-red-600 text-sm">Gérer ce souvenir</p>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('🗑️ Supprimer ce souvenir ?')) {
                    handleDeleteMemory(memory.id);
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const IdeaDetail = ({ idea }) => {
    if (!idea) {
      return (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Idée introuvable</h3>
          <p className="text-gray-500">Cette idée n'existe plus ou n'a pas pu être chargée.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{idea.title}</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
            <span className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              {idea.author} ({idea.age})
            </span>
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {idea.created_at ? new Date(idea.created_at).toLocaleDateString('fr-FR') : 'Récent'}
            </span>
            <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${categories.find(c => c.id === idea.category)?.color} text-white text-xs font-semibold`}>
              {categories.find(c => c.id === idea.category)?.name}
            </span>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 mb-2">📝 Description de l'activité :</h4>
          <p className="text-gray-600 bg-gray-50 rounded-lg p-4">{idea.description}</p>
        </div>

        {idea.why && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">🌟 Pourquoi cette activité :</h4>
            <p className="text-gray-600 bg-gray-50 rounded-lg p-4">{idea.why}</p>
          </div>
        )}

        {idea.logistics && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">🔧 Informations pratiques :</h4>
            <p className="text-gray-600 bg-gray-50 rounded-lg p-4">{idea.logistics}</p>
          </div>
        )}

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-6">
              <span className="flex items-center text-gray-600">
                <Heart className="w-5 h-5 mr-2 text-red-500" />
                {idea.likes || 0} likes
              </span>
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  if (window.confirm('🗑️ Supprimer cette idée ?')) {
                    handleDeleteIdea(idea.id);
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Navigation mobile
  const MobileNavigation = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex">
        {[
          { id: 'home', icon: Home, label: 'Accueil' },
          { id: 'explore', icon: Search, label: 'Explorer' },
          { id: 'memories', icon: Camera, label: 'Souvenirs' },
          { id: 'meditation', icon: FileText, label: 'Méditation' },
          { id: 'teaser', icon: Video, label: 'Teaser' },
          ...(isAdmin ? [{ id: 'admin', icon: Settings, label: 'Admin' }] : [])
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-3 px-2 text-center ${
              activeTab === id ? 'text-purple-600' : 'text-gray-400'
            }`}
          >
            <Icon className="w-5 h-5 mx-auto mb-1" />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // Rendu des pages
  const renderActiveTab = () => {
    switch(activeTab) {
      case 'home': return <HomePage />;
      case 'explore': return <ExplorePage />;
      case 'memories': return <MemoriesPage />;
      case 'meditation': return <MeditationPage />;
      case 'teaser': return <TeaserPage />;
      case 'admin': return isAdmin ? <AdminPage /> : <HomePage />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 py-8 pb-20 md:pb-8">
        {renderActiveTab()}
      </main>

      {/* Boutons flottants */}
      {activeTab === 'memories' && (
        <button 
          onClick={() => setCurrentModal('memory-form')}
          className="fixed bottom-20 md:bottom-8 right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 z-40"
          title="Ajouter un souvenir"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {(activeTab === 'home' || activeTab === 'explore') && (
        <button 
          onClick={() => setCurrentModal('idea-form')}
          className="fixed bottom-20 md:bottom-8 right-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 z-40"
          title="Proposer une idée"
        >
          <Lightbulb className="w-6 h-6" />
        </button>
      )}

      <MobileNavigation />

      {/* System de modales unifié */}
      {currentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {currentModal === 'idea-form' && '💡 Propose une activité !'}
                {currentModal === 'memory-form' && '✨ Partager un souvenir'}
                {currentModal === 'memory-detail' && '📖 Souvenir partagé'}
                {currentModal === 'idea-detail' && '📋 Détails de l\'idée'}
              </h2>
              <button
                onClick={closeAllModals}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {currentModal === 'idea-form' && <IdeaForm />}
            {currentModal === 'memory-form' && <MemoryForm />}
            {currentModal === 'memory-detail' && <MemoryDetail memory={selectedMemory} />}
            {currentModal === 'idea-detail' && <IdeaDetail idea={selectedIdea} />}
          </div>
        </div>
      )}

      {/* Modal admin */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-center">🔐 Accès Administration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe :
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Tapez le mot de passe admin..."
                  autoFocus
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowAdminModal(false);
                    setAdminPassword('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAdminLogin}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                >
                  Se connecter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouthRetreatIdeasApp;
