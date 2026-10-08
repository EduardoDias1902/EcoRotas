/* ============================================
   EcoRota - Application Logic (MVP)
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // ===== DOM REFERENCES =====
    const splashScreen = document.getElementById('splash-screen');
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    const pageContent = document.getElementById('page-content');
    const bottomNav = document.getElementById('bottom-nav');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    const matchModal = document.getElementById('match-modal');

    // Login buttons
    const btnLogin = document.getElementById('btn-login');
    const btnLoginProdutor = document.getElementById('btn-login-produtor');
    const btnLoginFreteiro = document.getElementById('btn-login-freteiro');

    // Freight confirm
    const btnConfirmFrete = document.getElementById('btn-confirm-frete');
    const fretePrice = document.getElementById('frete-price');
    const cargoOptions = document.getElementById('cargo-options');

    // Match modal
    const btnAcceptMatch = document.getElementById('btn-accept-match');
    const btnDeclineMatch = document.getElementById('btn-decline-match');

    // Nav items
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    // State
    let currentUserType = 'produtor'; // 'produtor' or 'freteiro'
    let currentPage = 'solicitar';
    let trackingInterval = null;

    // ===== SPLASH SCREEN =====
    if (splashScreen) {
        setTimeout(() => {
            splashScreen.classList.add('fade-out');
            setTimeout(() => {
                splashScreen.style.display = 'none';
                if (loginScreen) {
                    loginScreen.style.display = 'block';
                    loginScreen.classList.add('fade-in-up');
                }
            }, 600);
        }, 2200);
    }

    // ===== LOGIN FLOW =====
    function loginAs(type) {
        currentUserType = type;
        if (loginScreen) loginScreen.style.display = 'none';
        if (mainApp) {
            mainApp.style.display = 'flex';
            mainApp.classList.add('fade-in-up');
        }

        // Configure nav based on user type
        updateNavForUserType(type);

        // Navigate to first page
        if (type === 'produtor') {
            navigateTo('solicitar');
        } else {
            navigateTo('freteiro');
        }

        showToast(`Bem-vindo ao EcoRota! Modo ${type === 'produtor' ? 'Produtor Rural' : 'Motorista/Freteiro'}`);
    }

    if (btnLogin) btnLogin.addEventListener('click', () => loginAs('produtor'));
    if (btnLoginProdutor) btnLoginProdutor.addEventListener('click', () => loginAs('produtor'));
    if (btnLoginFreteiro) btnLoginFreteiro.addEventListener('click', () => loginAs('freteiro'));

    // ===== NAVIGATION =====
    function updateNavForUserType(type) {
        const navFreteiro = document.getElementById('nav-freteiro');
        const navProdutor = document.getElementById('nav-produtor');

        if (type === 'produtor') {
            navItems.forEach(item => item.style.display = 'flex');
        } else {
            navItems.forEach(item => item.style.display = 'flex');
        }
    }

    function navigateTo(pageName) {
        currentPage = pageName;

        // Clear tracking interval if we leave the tracking page
        if (pageName !== 'cargas' && trackingInterval) {
            clearInterval(trackingInterval);
            trackingInterval = null;
        }

        // Update pages
        pages.forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(`page-${pageName}`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Update nav
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageName) {
                item.classList.add('active');
            }
        });

        // Add stagger animation to the page inner
        const pageInner = targetPage?.querySelector('.page-inner');
        if (pageInner) {
            pageInner.classList.remove('stagger-children');
            void pageInner.offsetWidth; // force reflow
            pageInner.classList.add('stagger-children');
        }
        
        // Trigger specific page logic
        if (pageName === 'impacto' || pageName === 'freteiro') {
            animateCounters();
        }

        // Scroll to top
        if (pageContent) pageContent.scrollTop = 0;
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            if (page) {
                navigateTo(page);

                // Haptic-like micro-feedback
                item.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    item.style.transform = '';
                }, 100);
            }
        });
    });

    // ===== CARGO OPTIONS SELECTION =====
    if (cargoOptions) {
        const options = cargoOptions.querySelectorAll('.cargo-option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                // Deselect all
                options.forEach(o => {
                    o.classList.remove('selected');
                    o.querySelector('.cargo-check i').className = 'far fa-square';
                });
                // Select clicked
                option.classList.add('selected');
                option.querySelector('.cargo-check i').className = 'fas fa-check-circle';
                // Update price
                const price = option.dataset.price;
                if (fretePrice) fretePrice.textContent = price;
            });
        });
    }

    // ===== CONFIRM FREIGHT =====
    if (btnConfirmFrete) {
        btnConfirmFrete.addEventListener('click', () => {
            btnConfirmFrete.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando motoristas...';
            btnConfirmFrete.style.pointerEvents = 'none';

            setTimeout(() => {
                btnConfirmFrete.innerHTML = `<i class="fas fa-check"></i> Confirmar Frete • R$ ${fretePrice ? fretePrice.textContent : '42'}`;
                btnConfirmFrete.style.pointerEvents = '';
                if (matchModal) matchModal.style.display = 'flex';
            }, 1800);
        });
    }

    // ===== MATCH MODAL =====
    if (btnAcceptMatch) {
        btnAcceptMatch.addEventListener('click', () => {
            if (matchModal) matchModal.style.display = 'none';
            showToast('Match aceito! Seu frete está a caminho 🚛');
            // Navigate to tracking
            navigateTo('cargas');
            startTrackingAnimation();
        });
    }

    if (btnDeclineMatch) {
        btnDeclineMatch.addEventListener('click', () => {
            if (matchModal) matchModal.style.display = 'none';
            showToast('Buscando outros motoristas na rota...');
        });
    }

    // ===== CARGO ACCEPT (Freteiro mode) =====
    document.querySelectorAll('.btn-accept').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cargoId = btn.dataset.cargo;
            const card = document.getElementById(`cargo-card-${cargoId}`);

            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
            btn.style.pointerEvents = 'none';

            setTimeout(() => {
                if (card) card.classList.add('accepted');
                btn.innerHTML = '<i class="fas fa-check-circle"></i> Carga Aceita!';

                // Update stats
                const statValue = document.querySelector('.stat-card:last-child .stat-value');
                if (statValue) {
                    const current = parseInt(statValue.textContent) || 0;
                    statValue.textContent = `${current + 1} cargas`;
                }

                showToast(`Carga #${cargoId} aceita com sucesso!`);
            }, 1200);
        });
    });

    // ===== TRACKING ANIMATION =====
    function startTrackingAnimation() {
        const etaEl = document.querySelector('.tracking-eta');
        const statusLabel = document.querySelector('.status-label');
        if (!etaEl || !statusLabel) return;
        
        let minutes = 15;

        // Limpa se já existir um intervalo anterior
        if (trackingInterval) clearInterval(trackingInterval);

        trackingInterval = setInterval(() => {
            minutes--;
            if (minutes <= 0) {
                clearInterval(trackingInterval);
                trackingInterval = null;
                etaEl.textContent = 'Chegou!';
                statusLabel.textContent = 'MOTORISTA CHEGOU';
                showToast('O motorista chegou! Apresente o PIN: 4829');
                return;
            }
            etaEl.textContent = `Chega em ${minutes} min`;
        }, 5000); // Updates every 5 seconds for demo purposes
    }

    // ===== TOAST NOTIFICATION =====
    function showToast(message) {
        if (!toast || !toastMsg) return;
        toastMsg.textContent = message;
        toast.classList.add('show');

        // Limpa classes anteriores e garante a remoção
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }

    // ===== MAP LOCATE BUTTONS =====
    document.querySelectorAll('.map-locate-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showToast('Centralizando localização pelo GPS...');
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-crosshairs');
                icon.classList.add('fa-spinner', 'fa-spin');
                setTimeout(() => {
                    icon.classList.remove('fa-spinner', 'fa-spin');
                    icon.classList.add('fa-crosshairs');
                }, 1000);
            }
        });
    });

    // ===== SHARE BUTTON =====
    const shareBtn = document.querySelector('.btn-share');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            if (navigator.share) {
                navigator.share({
                    title: 'EcoRota - Meu Impacto Ecológico',
                    text: 'Economizei R$ 840 em frete e evitei o desperdício de 1.420 kg de alimentos com o EcoRota!',
                    url: window.location.href
                }).catch(() => {});
            } else {
                showToast('Link de compartilhamento copiado!');
            }
        });
    }

    // ===== SAVE PREFERENCES =====
    const savePrefBtn = document.querySelector('.btn-save-prefs');
    if (savePrefBtn) {
        savePrefBtn.addEventListener('click', () => {
            savePrefBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
            setTimeout(() => {
                savePrefBtn.innerHTML = '<i class="fas fa-save"></i> SALVAR PREFERÊNCIAS';
                showToast('Preferências sanitárias salvas com sucesso!');
            }, 1000);
        });
    }

    // ===== SOLICITAR FRETE COM EXIGÊNCIAS =====
    const solicitarExigBtn = document.querySelector('.btn-solicitar-exig');
    if (solicitarExigBtn) {
        solicitarExigBtn.addEventListener('click', () => {
            navigateTo('solicitar');
            showToast('Suas exigências sanitárias foram aplicadas ao frete');
        });
    }

    // ===== PREFERENCE TOGGLES =====
    document.querySelectorAll('.pref-item').forEach(item => {
        item.addEventListener('click', () => {
            const check = item.querySelector('.pref-check');
            const status = item.querySelector('.pref-status');
            if (!check) return;
            
            const isActive = check.classList.contains('active');

            if (isActive) {
                check.classList.remove('active');
                check.querySelector('i').className = 'far fa-square';
                if (status) {
                    status.className = 'pref-status optional';
                    status.textContent = 'OPCIONAL';
                }
            } else {
                check.classList.add('active');
                check.querySelector('i').className = 'fas fa-check-square';
                if (status) {
                    status.className = 'pref-status active-status';
                    status.textContent = 'ATIVO';
                }
            }
        });
    });

    // ===== ZONES BUTTON (Freteiro profile) =====
    const zonesBtn = document.querySelector('.btn-zones');
    if (zonesBtn) {
        zonesBtn.addEventListener('click', () => showToast('Gerenciador de zonas em desenvolvimento'));
    }

    // ===== LAUDO BUTTON =====
    const laudoBtn = document.querySelector('.btn-laudo');
    if (laudoBtn) {
        laudoBtn.addEventListener('click', () => showToast('Solicitação de vistoria enviada à ANVISA regional'));
    }

    // ===== MAP OPPORTUNITY BUTTON =====
    const mapOppBtn = document.querySelector('.btn-map-opp');
    if (mapOppBtn) {
        mapOppBtn.addEventListener('click', () => showToast('Mapa de oportunidades em desenvolvimento'));
    }

    // ===== GPS BADGE ANIMATION =====
    const gpsBadge = document.getElementById('gps-badge');
    if (gpsBadge) {
        setInterval(() => {
            gpsBadge.style.opacity = '0.6';
            setTimeout(() => {
                gpsBadge.style.opacity = '1';
            }, 300);
        }, 4000);
    }

    // ===== COUNTER ANIMATIONS =====
    function animateCounters() {
        const valueEls = document.querySelectorAll('.impact-card-value, .stat-value');
        
        valueEls.forEach(el => {
            // Checa se já animou para não refazer toda vez, mas como MVP, podemos animar sempre
            // Vamos extrair apenas os números
            const originalHTML = el.innerHTML;
            const isCurrency = originalHTML.includes('R$');
            
            // Regex to extract number values, ignoring HTML tags
            const textContent = el.textContent.replace(/[^\d.,]/g, '').trim();
            if (!textContent) return;
            
            // Parse text logic (handles commas and dots)
            const isDecimal = textContent.includes(',');
            const rawValue = parseFloat(textContent.replace(/\./g, '').replace(',', '.'));
            
            if (isNaN(rawValue)) return;

            let start = 0;
            const duration = 1500; // ms
            const frameRate = 30; // ms
            const increment = rawValue / (duration / frameRate);
            
            const timer = setInterval(() => {
                start += increment;
                if (start >= rawValue) {
                    clearInterval(timer);
                    el.innerHTML = originalHTML; // restore exact original HTML with small tags etc
                    return;
                }
                
                let displayVal = "";
                if (isDecimal) {
                    displayVal = start.toFixed(2).replace('.', ',');
                } else {
                    displayVal = Math.floor(start).toLocaleString('pt-BR');
                }
                
                // Reconstruct simple HTML visually for the animation
                if (isCurrency) {
                    el.innerHTML = `R$ ${displayVal}`;
                } else if (originalHTML.includes('<small>')) {
                    const smallMatch = originalHTML.match(/<small>(.*?)<\/small>/);
                    const smallTag = smallMatch ? smallMatch[0] : '';
                    el.innerHTML = `${displayVal} ${smallTag}`;
                } else {
                    el.innerHTML = displayVal;
                }
            }, frameRate);
        });
    }

    // ===== USER AVATAR CLICK =====
    const userAvatar = document.getElementById('user-avatar');
    if (userAvatar) {
        userAvatar.addEventListener('click', () => {
            if (currentUserType === 'produtor') {
                navigateTo('produtor');
            } else {
                navigateTo('perfil-freteiro');
            }
        });
    }

    // ===== NAV: Add perfil-freteiro navigation via Produtor nav button for freteiro =====
    const navProdutor = document.getElementById('nav-produtor');
    if (navProdutor) {
        navProdutor.addEventListener('click', (e) => {
            if (currentUserType === 'freteiro') {
                // Override to show freteiro profile instead
                e.stopImmediatePropagation();
                navigateTo('perfil-freteiro');
                navItems.forEach(item => item.classList.remove('active'));
                navProdutor.classList.add('active');
            }
        }, true);
    }

    // ===== DELIVERY PIN RANDOM GENERATION =====
    const pinEl = document.getElementById('delivery-pin');
    if (pinEl) {
        const pin = Math.floor(1000 + Math.random() * 9000);
        pinEl.textContent = pin;
    }

    // ===== CALL & MESSAGE BUTTONS =====
    document.querySelectorAll('.btn-call').forEach(btn => {
        btn.addEventListener('click', () => showToast('Ligando para Carlos Silva...'));
    });

    document.querySelectorAll('.btn-msg').forEach(btn => {
        btn.addEventListener('click', () => showToast('Abrindo chat com Carlos Silva...'));
    });

    // ===== CERT BUTTONS =====
    document.querySelectorAll('.btn-outline-sm').forEach(btn => {
        btn.addEventListener('click', () => showToast('Documento aberto com sucesso'));
    });

    // ===== SEAL SYNC BUTTONS =====
    document.querySelectorAll('.seal-item .btn-icon-sm').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.add('fa-spin');
                setTimeout(() => {
                    icon.classList.remove('fa-spin');
                    showToast('Selo verificado e atualizado!');
                }, 1500);
            }
        });
    });
});
