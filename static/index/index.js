const { createApp } = Vue;

createApp({
  delimiters: ['[[', ']]'],
  data() {
    return {
      joinId: '',
      history: [],
      start: 0,
      count: 10,
      loading: false,
      allLoaded: false
    }
  },
  mounted() {
    setTimeout(() => {
      this.initObserver();
    }, 500);
  },
  methods: {
    async createGame() {
      try {
        const res = await fetch('/create');
        const data = await res.json();
        window.location.href = `/game/${data.id}`;
      } catch (e) {
        console.error("Creation failed", e);
      }
    },
    joinGame() {
      if (this.joinId) {
        window.location.href = `/game/${this.joinId.trim()}`;
      }
    },
    watchReplay(id) {
      window.location.href = `/replay/${id}`;
    },
    async loadHistory() {
      if (this.loading || this.allLoaded) return;
      
      this.loading = true;
      
      try {
        const res = await fetch(`/completed-games/${this.start}/${this.count}`);
        const data = await res.json();
        
        if (!data || data.length === 0) {
          this.allLoaded = true;
        } else {
          this.history.push(...data);
          this.start += data.length;
          
          if (data.length < this.count) {
            this.allLoaded = true;
          }
        }
      } catch (e) {
        console.error("History fetch failed", e);
      } finally {
        this.loading = false;
      }
    },
    initObserver() {
      const target = document.getElementById('scroll-anchor');
      if (!target) return;

      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !this.loading && !this.allLoaded) {
          this.loadHistory();
        }
      }, { 
        root: null, 
        rootMargin: '100px', 
        threshold: 0.1 
      });
      
      observer.observe(target);
    }
  }
}).mount('#app');