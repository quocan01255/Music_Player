/**
 * 1. Render songs
 * 2. Scroll top
 * 3. Play / pause / seek
 * 4. CD Rotate
 * 5. Next / prev
 * 6. Random
 * 7. Next / Repeat when ended
 * 8. Active songs
 * 9. Scroll active song into view
 * 10. Play song when click
 */

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const PLAYER_STORAGE_KEY = "Player"

const playList = $('.playlist');
const player = $('.player');
const cd = $('.cd');
const heading = $('header h2');
const cdThumb = $('.cd-thumb');
const audio = $('#audio');
const playBtn = $('.btn-toggle-play');
const progress = $('#progress');
const nextBtn = $('.btn-next');
const prevBtn = $('.btn-prev');
const randomBtn = $('.btn-random');
const repeatBtn = $('.btn-repeat');


var songsPlayed = [];

const app = {
    currentIndex: 0,
    isPlaying: false,
    isRandom: false,
    isRepeat: false,
    config: JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)) || {},
    songs: [
        {
            name: 'Here with me',
            singer: 'd4vd',
            path: './assets/music/d4vd - Here With Me Official Audio.mp3',
            image: './assets/img/herewithme.jpg'
        },
        {
            name: 'Arcade',
            singer: 'Duncan Laurence',
            path: './assets/music/Duncan Laurence - Loving You Is A Losing Game Arcade Lyrics.mp3',
            image: './assets/img/arcade.jpg'
        },
        {
            name: 'Shadow Of The Sun',
            singer: 'Max Elto',
            path: './assets/music/In The Shadow Of The Sun.mp3',
            image: './assets/img/shadowofthesun.jpg'
        },
        {
            name: 'Dandelions',
            singer: 'Ruth B',
            path: './assets/music/Ruth B - Dandelions Lyrics.mp3',
            image: './assets/img/dandelions.png'
        },
        {
            name: 'Happier',
            singer: 'Marshmello ft Bastille',
            path: './assets/music/Marshmello ft Bastille - Happier Official Music Video.mp3',
            image: './assets/img/happier.png'
        },
        {
            name: 'The Nights',
            singer: 'Avicii',
            path: './assets/music/Avicii  - The Nights.mp3',
            image: './assets/img/thenights.png'
        }
    ],
    setConfig: function(key, value) {
        this.config[key] = value;
        localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(this.config));
    },
    render: function() {
        const htmls = this.songs.map((song, index) => {
            return `
            <div class="song ${index === this.currentIndex ? 'active' : ''}" data-index=${index}>
                <div class="thumb" style="background-image: url('${song.image}')">
                </div>
                <div class="body">
                    <h3 class="title">${song.name}</h3>
                    <p class="author">${song.singer}</p>
                </div>
                <div class="option">
                    <i class="fas fa-ellipsis-h"></i>
                </div>
            </div>
            `
        })
        playList.innerHTML = htmls.join('');
    },
    defineProperties: function() {
        Object.defineProperty(this, 'currentSong', {
            get: function() {
                return this.songs[this.currentIndex];
            }
        });
    },
    handleEvents: function() {
        const _this = this;
        const cdWidth = cd.offsetWidth;
        
        // Xử lý CD quay và dừng
        const cdThumbAnimate = cdThumb.animate([
            { transform: 'rotate(360deg)'}
        ], {
            duration: 10000,
            iterations: Infinity
        })
        cdThumbAnimate.pause();

        // Xử lý phóng to / thu nhỏ CD
        document.onscroll = function() {
            const scrollTop = window.scrollY;
            const newCdWidth = cdWidth - scrollTop;
            
            cd.style.width = newCdWidth > 0 ? newCdWidth + 'px' : 0;
            cd.style.opacity = newCdWidth/cdWidth;
        }

        // Xử lý khi click play
        playBtn.onclick = function() {
            if (_this.isPlaying) {
                audio.pause();
            } else {
                audio.play();
            }
        }

        // Khi bài hát được play
        audio.onplay = function() {
            _this.isPlaying = true;
            player.classList.add('playing');
            cdThumbAnimate.play();
            _this.setConfig('currentIndex', _this.currentIndex);

        }

        // Khi bài hát được pause
        audio.onpause = function() {
            _this.isPlaying = false;
            player.classList.remove('playing');
            cdThumbAnimate.pause();
        }

        // Khi tiến độ bài hát thay đổi
        audio.ontimeupdate = function() {
            if (audio.duration) {
                const progressPercent = Math.floor(audio.currentTime/audio.duration*100);
                progress.value = progressPercent;
            }
        }

        // Xử lý khi tua bài hát
        progress.oninput = function() {
            const seekTime = (progress.value/100) * audio.duration;
            audio.currentTime = seekTime;
        }

        // Khi next song
        nextBtn.onclick = function() {
            _this.addSongPlayed();
            if (_this.isRandom) {
                do {
                    _this.playRandomSong();
                } while (_this.checkIfSongPlayed())
            } else {
                _this.nextSong();
            }
            audio.play();
            _this.render();
            _this.scrollToActiveSong();
            
        }

        // Khi prev song
        prevBtn.onclick = function() {
            _this.addSongPlayed();
            if (_this.isRandom) {
                do {
                    _this.playRandomSong();
                } while (_this.checkIfSongPlayed())
            } else {
                _this.prevSong();
            }
            audio.play();
            _this.render();
            _this.scrollToActiveSong();
        }

        // Xử lý bật / tắt nút random
        randomBtn.onclick = function() {
            _this.isRandom = !_this.isRandom;
            _this.setConfig('isRandom', _this.isRandom);
            randomBtn.classList.toggle('active', _this.isRandom);
        }

        // Xử lý lặp lại song
        repeatBtn.onclick = function() {
            _this.isRepeat = !_this.isRepeat;
            _this.setConfig('isRepeat', _this.isRepeat);
            repeatBtn.classList.toggle('active', _this.isRepeat);
        }

        // Xử lý next song khi audio ended
        audio.onended = function() {
            if (_this.isRepeat) {
                audio.play();
            } else {
                nextBtn.click();
            }
        }

        // Lắng nghe hành vi click vào playlist
        playList.onclick = function(e) {
            const songNode = e.target.closest('.song:not(.active)');
            if (songNode || e.target.closest('.option')) {
                // Xử lý khi click song
                if (songNode) {
                    _this.currentIndex = Number(songNode.dataset.index);
                    _this.loadCurrentSong();
                    audio.play();
                    _this.render();
                }

                // Xử lý khi click song option
                if (e.target.closest('.option')) {

                }
            }
        }
        
    },
    loadCurrentSong: function() {
        heading.textContent = this.currentSong.name;
        cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`;
        audio.src = this.currentSong.path;
    },
    loadConfig: function() {
        this.isRandom = this.config.isRandom || false;
        this.isRepeat = this.config.isRepeat || false;
        this.currentIndex = this.config.currentIndex || 0;
    },
    scrollToActiveSong: function() {
        setTimeout(() => {
            $('.song.active').scrollIntoView({
                behavior: 'smooth',
                block: 'end',
                inline: 'nearest'
            });
        }, 300)
    },
    nextSong: function() {
        this.currentIndex++;
        if (this.currentIndex >= this.songs.length) {
            this.currentIndex = 0;
        }
        this.loadCurrentSong();
    },
    prevSong: function() {
        this.currentIndex--;
        if (this.currentIndex < 0) {
            this.currentIndex = this.songs.length - 1;
        }
        this.loadCurrentSong();
    },
    playRandomSong: function() {
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random()*this.songs.length);
        } while (randomIndex === this.currentIndex);
        this.currentIndex = randomIndex;
        this.loadCurrentSong();
    },
    checkIfSongPlayed: function() {
        let songExist = songsPlayed.find((song) => {
            return song === this.currentSong;
        });
        return songExist;
    },
    addSongPlayed: function() {
        if (!this.checkIfSongPlayed()) {
            songsPlayed.push(this.currentSong);
        };
        if (songsPlayed.length == this.songs.length) {
            songsPlayed = [];
            songsPlayed.push(this.currentSong)
        };
    },
    start: function() {
        // Gán cấu hình từ config vào app
        this.loadConfig();

        // Định nghĩa các thuộc tính cho Object
        this.defineProperties();

        // Lắng nghe / xử lý các sự kiện
        this.handleEvents();

        // Tải thông tin bài hát hiện tại vào UI khi chạy app
        this.loadCurrentSong();

        // Render playlist
        this.render();

        // Hiển thị trạng thái ban đầu của nút repeat và random
        repeatBtn.classList.toggle('active', this.isRepeat);
        randomBtn.classList.toggle('active', this.isRandom);
    }
}

app.start();