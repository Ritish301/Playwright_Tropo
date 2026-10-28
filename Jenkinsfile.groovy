pipeline {
    agent none

    stages {

        stage('Checkout') {
            agent {
                label 'build'
            }
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            agent {
                label 'build'
            }
            steps {
                bat 'npm install'
            }
        }

        stage('Install Browsers') {
            agent {
                label 'build'
            }
            steps {
                bat 'npx playwright install'
            }
        }

        stage('Install Tropo Application') {
            agent {
                label 'test'
            }
            steps {
                bat '"D:\\Ritish\\Test\\Tropo Setup 2.0.14.exe"'
                bat 'timeout /t 30'
            }
        }

        stage('Launch Tropo') {
            agent {
                label 'test'
            }
            steps {
                rem Update this path to the actual installed EXE
                bat 'start "" "C:\\Program Files\\Tropo\\Tropo.exe"'
                bat 'timeout /t 30'
            }
        }

        stage('Run Playwright Tests') {
            agent {
                label 'test'
            }
            steps {
                bat 'npm run MC_SMOKE'
            }
        }

        stage('Deploy') {
            agent {
                label 'test'
            }
            steps {
                echo 'Playwright tests passed. Deploying application...'
                // Add deployment commands here
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'playwright-report/**/*', allowEmptyArchive: true
        }

        failure {
            echo 'Playwright failed. Deployment stopped.'
        }
    }
}
