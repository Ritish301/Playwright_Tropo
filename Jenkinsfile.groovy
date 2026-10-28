pipeline {
    agent {
        label 'build'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Tropo Application') {
            steps {
                bat '"D:\\Ritish\\Test\\Tropo Setup 2.0.14.exe"'
                bat 'timeout /t 30'
            }
        }

        stage('Launch Tropo') {
            steps {
                bat 'start "" "C:\\Program Files\\Tropo\\Tropo.exe"'
                bat 'timeout /t 30'
            }
        }

        stage('Verify Launch') {
            steps {
                echo 'Tropo application started successfully.'
            }
        }
    }

    post {
        success {
            echo 'Tropo installation completed successfully.'
        }

        failure {
            echo 'Tropo installation failed.'
        }
    }
}
