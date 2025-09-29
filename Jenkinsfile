pipeline {
  agent { label 'docker-agent' }   // ensure this matches node label you created
  environment {
    AWS_REGION = 'ap-south-1'      // change to your region
    ECR_REPO = 'sample-app'
    CLUSTER_NAME = 'demo-cluster'
  }
  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Prepare') {
      steps {
        script {
          // get account id and short commit
          AWS_ACCOUNT_ID = sh(script: "aws sts get-caller-identity --query Account --output text", returnStdout: true).trim()
          GIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
          IMAGE_TAG = "${env.BUILD_NUMBER}-${GIT_SHORT}"
          ECR_URI = "${AWS_ACCOUNT_ID}.dkr.ecr.${env.AWS_REGION}.amazonaws.com/${env.ECR_REPO}:${IMAGE_TAG}"
          echo "ECR_URI=${ECR_URI}"
          env.ECR_URI = ECR_URI
        }
      }
    }
    stage('Build Docker image') {
      steps {
        sh 'docker build -t $ECR_URI .'
      }
    }
    stage('Login & Push to ECR') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'aws-creds', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
          sh '''
            aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
            aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
            aws configure set region $AWS_REGION
            aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
            # create repository if not exists
            if ! aws ecr describe-repositories --repository-names $ECR_REPO >/dev/null 2>&1; then
              aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION
            fi
            docker push $ECR_URI
          '''
        }
      }
    }
    stage('Deploy to EKS') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'aws-creds', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
          sh '''
            aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
            aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
            aws configure set region $AWS_REGION
            aws eks --region $AWS_REGION update-kubeconfig --name $CLUSTER_NAME
            # attempt to set image; fallback to apply manifests that reference correct image env var
            kubectl set image deployment/sample-deployment sample-container=$ECR_URI --record || \
              (sed -e "s|REPLACE_WITH_ECR_IMAGE|$ECR_URI|g" k8s/deployment.yaml | kubectl apply -f -)
          '''
        }
      }
    }
  }
  post {
    always {
      echo "Build finished. Image: ${env.ECR_URI}"
    }
  }
}

